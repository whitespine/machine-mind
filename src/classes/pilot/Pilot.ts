import {
    Rules,
    Reserve,
    MechSkills,
    PilotLoadout,
    Talent,
    CoreBonus,
    Mech,
    Organization,
    Faction,
    Counter,
    Quirk,
    License,
    Skill,
    Bonus,
    PilotArmor,
    PilotGear,
    PilotWeapon,
} from "@src/class";
import * as gistApi from "@src/io/apis/gist";
import {
    PackedActionData,
    RegActionData,
    RegOrganizationData,
    PackedRankedData,
    PackedReserveData,
    PackedMechData,
    PackedCounterSaveData,
    PackedCounterData,
    IMechState,
    PackedPilotLoadoutData,
    RegCounterData,
    PackedSkillData,
    RegPilotLoadoutData,
    PackedOrganizationData,
} from "@src/interface";
import {
    EntryType,
    InsinuateHooks,
    InventoriedRegEntry,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { bound_int, defaults, mech_cloud_sync } from "@src/funcs";
import { get_user_id } from "@src/hooks";
import { CC_VERSION } from "@src/enums";
import {
    finding_iterate,
    fallback_obtain_ref,
    RegFallback,
} from "../regstack";

// Note: we'll need to mogrify our pilot data a little bit to coerce it to this form

interface BothPilotData {
    campaign: string;
    group: string;
    sort_index: number;
    cloudID: string;
    cloudOwnerID: string;
    lastCloudUpdate: string;
    level: number;
    callsign: string;
    name: string;
    player_name: string;
    status: string;
    text_appearance: string;
    notes: string;
    history: string;
    portrait: string;
    cloud_portrait: string;
    current_hp: number;
    background: string;
    mechSkills: [number, number, number, number];
    cc_ver: string;
}

// The compcon export format. This stuff just gets converted into owned items.
export interface PackedPilotData extends BothPilotData {
    id: string;
    licenses: PackedRankedData[];
    skills: Array<PackedRankedData | (PackedSkillData & { custom: true })>;
    talents: PackedRankedData[];
    reserves: PackedReserveData[];
    orgs: PackedOrganizationData[];
    mechs: PackedMechData[];
    state?: IMechState;
    counter_data: PackedCounterSaveData[];
    custom_counters: PackedCounterData[];
    loadout: PackedPilotLoadoutData;
    active_mech: string;
    brews: string[];
    core_bonuses: string[];
    factionID: string;
    quirk: string;
}

// This just gets converted into owned items
export interface RegPilotData extends Required<BothPilotData> {
    lid: string;
    active_mech: RegRef<EntryType.MECH> | null;

    // Compcon doesn't (but should) track these
    current_overshield: number;

    // We do own these, though
    custom_counters: RegCounterData[];

    // Contains refs to our equpment, which we still own independently via our inventory
    loadout: RegPilotLoadoutData;

    // We don't really track active state much here. We do at least track mounted state
    mounted: boolean;
}

export class Pilot extends InventoriedRegEntry<EntryType.PILOT> {
    // Identity
    LID!: string; // As with all ids
    Name!: string;
    Callsign!: string;
    PlayerName!: string;
    Background!: string;
    Notes!: string;
    History!: string;
    Portrait!: string;
    TextAppearance!: string;

    Group!: string;
    SortIndex!: number;

    Campaign!: string;

    CloudID!: string;
    CloudOwnerID!: string;
    CloudPortrait!: string;
    LastCloudUpdate!: string;

    Level!: number;
    Status!: string; // I honestly have no idea what this is
    CurrentHP!: number;
    Overshield!: number;
    Loadout!: PilotLoadout;
    ActiveMech!: Mech | null;
    Mounted!: boolean;
    // State!: ActiveState;

    MechSkills!: MechSkills;

    // Mechs!: Mech[];
    CustomCounters!: Counter[];
    // The version of compcon that produced this
    CCVersion!: string;

    // All the below fields are read only, derived from the contents of the pilot reg. To add or remove to these, you need to create/insinuate/destroy entries of the pilot reg
    // These are the weapons and stuff that we _own_, not necessarily that is currently in our loudout
    private _owned_armor!: PilotArmor[]; // We do not want people to mistakenly try to add to this - it is derived
    public get OwnedArmor(): PilotArmor[] {
        return [...this._owned_armor];
    }

    private _owned_gear!: PilotGear[]; // We do not want people to mistakenly try to add to this - it is derived
    public get OwnedGear(): PilotGear[] {
        return [...this._owned_gear];
    }

    private _owned_weapons!: PilotWeapon[]; // We do not want people to mistakenly try to add to this - it is derived
    public get OwnedWeapons(): PilotWeapon[] {
        return [...this._owned_weapons];
    }

    private _core_bonuses!: CoreBonus[]; // We do not want people to mistakenly try to add to this - it is derived
    public get CoreBonuses(): CoreBonus[] {
        return [...this._core_bonuses];
    }

    private _factions!: Faction[];
    public get Factions(): Faction[] {
        return [...this._factions];
    }

    private _reserves!: Reserve[]; // We do not want people to mistakenly try to add to this - it is derived
    public get Reserves(): Reserve[] {
        return [...this._reserves];
    }

    private _orgs!: Organization[];
    public get Orgs(): Organization[] {
        return [...this._orgs];
    }

    private _skills!: Skill[];
    public get Skills(): Skill[] {
        return [...this._skills];
    }

    private _talents!: Talent[];
    public get Talents(): Talent[] {
        return [...this._talents];
    }

    private _licenses!: License[];
    public get Licenses(): License[] {
        return [...this._licenses];
    }

    private _quirks!: Quirk[];
    public get Quirks(): Quirk[] {
        return [...this._quirks];
    }

    protected enumerate_owned_items(): RegEntry<any>[] {
        return [
            ...this._owned_weapons,
            ...this._owned_armor,
            ...this._owned_gear,
            ...this._core_bonuses,
            ...this._factions,
            ...this._skills,
            ...this._talents,
            ...this._reserves,
            ...this._orgs,
            ...this._licenses,
        ];
    }

    public async get_assoc_entries(): Promise<RegEntry<any>[]> {
        return await this.Mechs();
    }

    // TODO: Create a more formalized method of tracking brew ids or something. Right now we just drop it when parsing, but it should really be an additional value on regentry creation
    public get Brews(): string[] {
        return [];
    }

    // -- Attributes --------------------------------------------------------------------------------
    public RenewID(): void {
        this.CloudID = "";
    }

    // public get Power(): number {
    // return (this.Level + 1) * 100
    // }

    public get HasIdent(): boolean {
        return !!(this.Name && this.Callsign);
    }

    // not gonna touch this one, chief
    /*
  public get Portrait(): string {
    if (this._cloud_portrait) return this._cloud_portrait
    else if (Capacitor.platform !== 'web' && this._portrait)
      return getImagePath(ImageTag.Pilot, this._portrait)
    else return getImagePath(ImageTag.Pilot, 'nodata.png', true)
  }
  */

    // -- Cloud -------------------------------------------------------------------------------------
    public get IsUserOwned(): boolean {
        return this.CloudOwnerID === get_user_id();
    }

    public async CloudSave(): Promise<any> {
        if (!this.CloudOwnerID) {
            this.CloudOwnerID = get_user_id();
        }
        if (!this.CloudID) {
            return gistApi.upload_new_pilot(this).then((response: any) => {
                this.setCloudInfo(response.id);
            });
        } else {
            return gistApi.update_cloud_pilot(this).then((response: any) => {
                this.setCloudInfo(response.id);
            });
        }
    }

    public async CloudLoad(): Promise<any> {
        if (!this.CloudID) return Promise.reject("No Cloud ID");
        return gistApi.download_pilot(this.CloudID).then(async (gist: any) => {
            // TODO
            console.error("not re-implemented (or at least tested) yet");
            // await this.load(Pilot.unpack_as_reg(gist));
            this.LastCloudUpdate = new Date().toString();
        });
    }

    public CloudCopy(): Promise<any> {
        this.CloudID = "";
        this.CloudOwnerID = "";
        return this.CloudSave();
    }

    public setCloudInfo(id: string): void {
        this.CloudID = id;
        this.CloudOwnerID = get_user_id();
        this.LastCloudUpdate = new Date().toString();
    }

    // -- Stats -------------------------------------------------------------------------------------
    public get Grit(): number {
        return Math.ceil(this.Level / 2);
    }

    public get MaxHP(): number {
        return this.sum_bonuses("pilot_hp");
    }

    public Heal(): void {
        this.CurrentHP = this.MaxHP;
    }

    public get Armor(): number {
        return bound_int(this.sum_bonuses("pilot_armor"), 0, Rules.MaxPilotArmor);
    }

    public get Speed(): number {
        return this.sum_bonuses("pilot_speed");
    }

    public get Evasion(): number {
        return this.sum_bonuses("pilot_evasion");
    }

    public get EDefense(): number {
        return this.sum_bonuses("pilot_edef");
    }

    public get LimitedBonus(): number {
        return this.sum_bonuses("limited_bonus");
    }

    public get AICapacity(): number {
        return this.sum_bonuses("ai_cap");
    }

    // -- Skills ------------------------------------------------------------------------------------
    public get CurrentSkillPoints(): number {
        return this.Skills.reduce((sum, skill) => sum + skill.CurrentRank, 0);
    }

    public get MaxSkillPoints(): number {
        return this.sum_bonuses("skill_point");
    }

    public get IsMissingSkills(): boolean {
        return this.CurrentSkillPoints < this.MaxSkillPoints;
    }

    public get TooManySkills(): boolean {
        return this.CurrentSkillPoints > this.MaxSkillPoints;
    }

    public get HasFullSkills(): boolean {
        return this.CurrentSkillPoints === this.MaxSkillPoints;
    }

    // -- Talents -----------------------------------------------------------------------------------
    public get CurrentTalentPoints(): number {
        return this.Talents.reduce((sum, talent) => sum + talent.CurrentRank, 0);
    }

    public get MaxTalentPoints(): number {
        return this.sum_bonuses("talent_point");
    }

    public get IsMissingTalents(): boolean {
        return this.CurrentTalentPoints < this.MaxTalentPoints;
    }

    public get TooManyTalents(): boolean {
        return this.CurrentTalentPoints > this.MaxTalentPoints;
    }

    public get HasFullTalents(): boolean {
        return this.CurrentTalentPoints === this.MaxTalentPoints;
    }

    // -- Core Bonuses ------------------------------------------------------------------------------

    public get CurrentCBPoints(): number {
        return this.CoreBonuses.length;
    }

    public get MaxCBPoints(): number {
        return this.sum_bonuses("cb_point");
    }

    public get IsMissingCBs(): boolean {
        return this.CurrentCBPoints < this.MaxCBPoints;
    }

    public get TooManyCBs(): boolean {
        return this.CurrentCBPoints > this.MaxCBPoints;
    }

    public get HasCBs(): boolean {
        return this.CurrentCBPoints === this.MaxCBPoints;
    }

    // -- Licenses ----------------------------------------------------------------------------------
    public CountLicenses(manufacturerID: string): number {
        return this.Licenses.filter(
            x => x.Manufacturer?.LID.toLowerCase() === manufacturerID.toLowerCase()
        ).reduce((a, b) => +a + +b.CurrentRank, 0);
    }

    public get CurrentLicensePoints(): number {
        return this.Licenses.reduce((sum, license) => sum + license.CurrentRank, 0);
    }

    public get MaxLicensePoints(): number {
        return this.sum_bonuses("license_point");
    }

    public get IsMissingLicenses(): boolean {
        return this.CurrentLicensePoints < this.MaxLicensePoints;
    }

    public get TooManyLicenses(): boolean {
        return this.CurrentLicensePoints > this.MaxLicensePoints;
    }

    public get HasLicenses(): boolean {
        return this.CurrentLicensePoints === this.MaxLicensePoints;
    }

    public getLicenseRank(name: string): number {
        const index = this.Licenses.find(l => l.Name == name);
        return index?.CurrentRank ?? 0;
    }

    // -- Mech Skills -------------------------------------------------------------------------------
    public get MaxHASEPoints(): number {
        return this.sum_bonuses("mech_skill_point");
    }

    public get IsMissingHASE(): boolean {
        return this.MechSkills.Sum < this.MaxHASEPoints;
    }

    public get TooManyHASE(): boolean {
        return this.MechSkills.Sum > this.MaxHASEPoints;
    }

    public get HasFullHASE(): boolean {
        return this.MechSkills.Sum === this.MaxHASEPoints;
    }

    // Umbrella utility function for deducing which mechs in a pool are owned by this mech
    // Slightly expensive, which is why we don't do it automatically
    public async Mechs(): Promise<Mech[]> {
        let all_mechs = await this.Registry.get_cat(EntryType.MECH).list_live(this.OpCtx);
        return all_mechs.filter(m => m.Pilot == this);
    }

    // Grabs counters from the pilot, their gear, their active mech, etc etc
    public get Counters(): Counter[] {
        return [
            ...this.Talents.flatMap(t => t.Counters),
            ...this.CoreBonuses.flatMap(cb => cb.Counters),
            ...(this.ActiveMech?.MechCounters() || []),
            ...this.CustomCounters,
        ];
    }

    // Lists all of the bonuses this unmounted pilot is receiving. Uses cache, as operation can be expensive
    private cached_bonuses: Bonus[] | null = null;
    public get AllBonuses(): Bonus[] {
        if (!this.cached_bonuses) {
            this.cached_bonuses = [
                ...this.Talents.flatMap(t => t.Bonuses),
                ...this.CoreBonuses.flatMap(cb => cb.Bonuses),
                ...this.Loadout.Items.flatMap(i => i.Bonuses),
                ...this.Quirks.flatMap(q => q.Bonuses),
                ...this.Factions.flatMap(f => []), // TODO - flesh out factions
                ...this.Reserves.flatMap(r => r.Bonuses),
                ...this.MechSkills.AllBonuses,
            ];
        }
        return this.cached_bonuses;
    }

    // Force a recompute of bonuses. Only needed if items/loadout are modified
    public recompute_bonuses(): void {
        this.cached_bonuses = null;
    }

    // Sum our pilot bonuses for the specified id, return the number
    private sum_bonuses(id: string): number {
        let filtered = this.AllBonuses.filter(b => b.LID == id);
        let ctx = Bonus.ContextFor(this);
        return Bonus.Accumulate(0, filtered, ctx).final_value;
    }

    public async load(data: RegPilotData): Promise<void> {
        data = { ...defaults.PILOT(), ...data };
        let subreg = await this.get_inventory();
        this.ActiveMech = data.active_mech
            ? await subreg.resolve(this.OpCtx, data.active_mech)
            : null;
        this.Background = data.background;
        this.Callsign = data.callsign;
        this.Campaign = data.campaign;
        this.CCVersion = data.cc_ver;
        this.CloudID = data.cloudID;
        this.CloudOwnerID = data.cloudOwnerID;
        this.CloudPortrait = data.cloud_portrait;
        this.CurrentHP = data.current_hp;
        this.CustomCounters = SerUtil.process_counters(data.custom_counters);
        this.Group = data.group;
        this.History = data.history;
        this.LID = data.lid;
        this.LastCloudUpdate = data.lastCloudUpdate;
        this.Level = data.level;
        this.Loadout = await new PilotLoadout(subreg, this.OpCtx, data.loadout).ready();
        this.MechSkills = new MechSkills(data.mechSkills);
        // this.Mechs = await subreg.resolve_many( this.OpCtx, data.mechs);
        this.Mounted = data.mounted;
        this.Name = data.name;
        this.Notes = data.notes;
        this.Overshield = data.current_overshield;
        this.PlayerName = data.player_name;
        this.Portrait = data.portrait;
        this.SortIndex = data.sort_index;
        this.Status = data.status;
        this.TextAppearance = data.text_appearance;

        this._factions = await subreg.get_cat(EntryType.FACTION).list_live(this.OpCtx);
        this._core_bonuses = await subreg.get_cat(EntryType.CORE_BONUS).list_live(this.OpCtx);
        this._quirks = await subreg.get_cat(EntryType.QUIRK).list_live(this.OpCtx);
        this._licenses = await subreg.get_cat(EntryType.LICENSE).list_live(this.OpCtx);
        this._skills = await subreg.get_cat(EntryType.SKILL).list_live(this.OpCtx);
        this._reserves = await subreg.get_cat(EntryType.RESERVE).list_live(this.OpCtx);
        this._talents = await subreg.get_cat(EntryType.TALENT).list_live(this.OpCtx);
        this._orgs = await subreg.get_cat(EntryType.ORGANIZATION).list_live(this.OpCtx);
        this._owned_armor = await subreg.get_cat(EntryType.PILOT_ARMOR).list_live(this.OpCtx);
        this._owned_weapons = await subreg.get_cat(EntryType.PILOT_WEAPON).list_live(this.OpCtx);
        this._owned_gear = await subreg.get_cat(EntryType.PILOT_GEAR).list_live(this.OpCtx);
    }

    protected save_imp(): RegPilotData {
        return {
            active_mech: this.ActiveMech?.as_ref() ?? null,
            background: this.Background,
            callsign: this.Callsign,
            campaign: this.Campaign,
            cc_ver: CC_VERSION,
            cloudID: this.CloudID,
            cloudOwnerID: this.CloudOwnerID,
            cloud_portrait: this.CloudPortrait,
            current_hp: this.CurrentHP,
            current_overshield: this.Overshield,
            custom_counters: SerUtil.save_all(this.CustomCounters),
            group: this.Group,
            history: this.History,
            lid: this.LID,
            lastCloudUpdate: this.LastCloudUpdate,
            level: this.Level,
            loadout: this.Loadout.save(),
            mechSkills: this.MechSkills.save(),
            // mechs: SerUtil.ref_all(this.Mechs),
            mounted: this.Mounted,
            name: this.Name,
            notes: this.Notes,
            player_name: this.PlayerName,
            portrait: this.Portrait,
            sort_index: this.SortIndex,
            status: this.Status,
            text_appearance: this.TextAppearance,
        };
    }
}

// Due to the nature of pilot data, and the fact that we generally desire to use this for synchronization of an existing pilot rather than as a one off compendium import,
// we define this separately. gather_source_regs is where we look if we can't find an item in the pilot that we expected - it will be added to the pilot
// If custom_pilot_inv, it will be used as the pilot's inventory registry. 
export async function cloud_sync(
    data: PackedPilotData,
    pilot: Pilot,
    fallback_source_regs: Registry[],
    hooks?: InsinuateHooks,
): Promise<{ pilot: Pilot; pilot_mechs: Mech[] } | null> {
    // Refresh the pilot
    let tmp_pilot = await pilot.refreshed();
    if (!tmp_pilot) {
        return null; // This is fairly catastrophic
    }
    pilot = tmp_pilot;
    let pilot_inv = await tmp_pilot.get_inventory();
    hooks = hooks ?? {};

    // The simplest way to do this is to, for each entry, just look in a regstack and insinuate to the pilot inventory.
    // if the item was already in the pilot inventory, then no harm!. If not, it is added.
    let stack: RegFallback = {
        base: pilot_inv,
        fallbacks: fallback_source_regs,
    };
    let ctx = pilot.OpCtx;
    // Identity
    pilot.LID = data.id;
    pilot.Name = data.name;
    pilot.Callsign = data.callsign;
    pilot.PlayerName = data.player_name;
    pilot.Background = data.background;
    pilot.Notes = data.notes;
    pilot.History = data.history;
    pilot.Portrait = data.portrait; // Should this be a link or something? Mayabe just not sync it?
    pilot.TextAppearance = data.text_appearance;

    // Fetch machine-mind stored licenses.
    const stack_licenses: License[] = [];
    for await (const i of finding_iterate(stack, ctx, EntryType.LICENSE)) {
        stack_licenses.push(i);
    }

    // Then, do lookups almost-as-normal. Can't just do gathering resolve because we dunno what the license will actually be called
    for (let cc_pilot_license of data.licenses) {
        // Do a lazy convert of the id. Due to the way compcon stores licenses we can't just do by ID, though I expect with the release of alt frames this will change. Sort of TODO
        // Find the corresponding license
        for (let sl of stack_licenses) {
            let found_corr_item = sl.FlatUnlocks.find(x => x.LID == cc_pilot_license.id);
            if (found_corr_item) {
                // We have found a local license corresponding to the new license.
                // First, check if owned by pilot
                if (sl.Registry.name() != pilot_inv.name()) {
                    // Grab a copy for our pilot
                    sl = await sl.insinuate(pilot_inv, ctx, hooks);
                }

                // Then update lvl and save
                sl.CurrentRank = cc_pilot_license.rank;
                await sl.writeback();
                // Got it - we can go
                break;
            }
        }
    }

    // Then do mechs
    let pilot_mechs = await pilot.Mechs();
    for (let md of data.mechs) {
        // For each imported mech entry, find the corrseponding mech actor entity by matching compcon id
        let corr_mech = pilot_mechs.find(m => m.LID == md.id);

        if (!corr_mech) {
            // Seems like the pilot has a mech that we haven't accounted for yet. Make a new one and add it to our tracker
            corr_mech = await pilot_inv.get_cat(EntryType.MECH).create_default(ctx);
            pilot_mechs.push(corr_mech);
        }

        // Tell it we own/pilot it
        corr_mech.Pilot = pilot;

        // Apply
        await mech_cloud_sync(md, corr_mech, fallback_source_regs, hooks);
    }

    // Try to find a quirk that matches, or create if not present
    // TODO: this is weird. compcon doesn't really do quirks. For now we just make new quirk if the quirk descriptions don't match?
    if (data.quirk) {
        if (!pilot.Quirks.find(q => q.Description == data.quirk)) {
            Quirk.unpack(data.quirk, pilot_inv, ctx);
            // Nothing else needs to be done
        }
    }

    // Meta pilot grouping. Pretty trivial
    pilot.Group = data.group;
    pilot.SortIndex = data.sort_index;
    pilot.Campaign = data.campaign;

    // Look for faction. Create if not present
    if (data.factionID) {
        if (!pilot.Factions.find(f => f.LID == data.factionID)) {
            let new_faction = await pilot_inv.create_live(EntryType.FACTION, ctx);
            new_faction.LID = data.factionID;
            new_faction.writeback();
        }
    }

    // Cloud info. Again, fairly straightforward. We just direct copy
    pilot.CloudID = data.cloudID;
    pilot.CloudOwnerID = data.cloudOwnerID;
    pilot.CloudPortrait = data.cloud_portrait; // Again - should we be downloading or something?
    pilot.LastCloudUpdate = new Date().toString();
    pilot.CCVersion = data.cc_ver;

    // State. Some of it is simple, other stuff isn't.
    pilot.Level = data.level;
    pilot.Status = data.status;
    pilot.CurrentHP = data.current_hp;
    pilot.MechSkills.load(data.mechSkills);
    pilot.CustomCounters = SerUtil.process_counters(
        SerUtil.unpack_counters_default(data.custom_counters)
    );

    // Core bonuses. Does not delete. All we care about is that we have them
    for (let cb of data.core_bonuses) {
        await fallback_obtain_ref(stack, ctx, {
            fallback_lid: cb,
            id: "",
            type: EntryType.CORE_BONUS,
        }, hooks);
    }

    // These are more user customized items, and need a bit more finagling (a bit like the mech)
    // For reserves, as they lack a meaningful way of identification we just clobber.
    for (let r of data.reserves) {
        // Though we could ref, almost always better to unpack due to custom data
        // TODO - don't clobber?
        for (let ur of pilot.Reserves) {
            ur.destroy_entry();
        }
        await Reserve.unpack(r, pilot_inv, ctx);
    }

    // Skills, we try to find and if not create
    for (let s of data.skills) {
        // Try to get/fetch pre-existing
        let found = await fallback_obtain_ref(stack, ctx, {
            fallback_lid: s.id,
            id: "",
            type: EntryType.SKILL
        }, hooks);
        if (!found) {
            // Make if we can
            if ((s as PackedSkillData).custom) {
                found = await Skill.unpack(s as PackedSkillData, pilot_inv, ctx);
            } else {
                // Nothing we can do for this one - ignore
                console.warn("Unrecognized skill: " + s.id);
                continue;
            }
        }

        // Can set rank regardless
        found.CurrentRank = s.rank ?? found.CurrentRank;

        // Details require custom
        if ((s as PackedSkillData).custom) {
            let ss = s as PackedSkillData;
            found.Description = ss.custom_desc ?? found.Description;
            found.Detail = ss.custom_detail ?? found.Detail;
        }

        // Save
        await found.writeback();
    }

    // Fetch talents. Also need to update rank. Due nothing to missing
    for (let t of data.talents) {
        let found = await fallback_obtain_ref(stack, ctx, {
            type: EntryType.TALENT,
            fallback_lid: t.id,
            id: ""
        }, hooks);
        if (found) {
            // Update rank
            found.CurrentRank = t.rank;
            found.writeback();
        }
    }

    // Look for org matching existing orgs. Create if not present. Do nothing to unmatched
    for (let org of data.orgs) {
        let corr_org = pilot.Orgs.find(o => o.Name == org.name);
        if (!corr_org) {
            // Make a new one
            corr_org = await pilot_inv.get_cat(EntryType.ORGANIZATION).create_default(ctx);
        }

        // Update / init
        corr_org.Actions ??= org.actions;
        corr_org.Description ??= org.description;
        corr_org.Efficiency ??= org.efficiency;
        corr_org.Influence ??= org.influence;
        corr_org.Name ??= org.name;
        corr_org.Purpose ??= org.purpose;
        corr_org.writeback();
    }

    // Sync counters
    for (let c of pilot.Counters) {
        c.sync_state_from(data.counter_data);
    }

    // Fetch all weapons, armor, gear we will need
    for (let a of data.loadout.armor) {
        if (a) {
            await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_ARMOR, fallback_lid: a.id, id: ""}, hooks);
        }
    }
    for (let w of [...data.loadout.weapons, ...data.loadout.extendedWeapons]) {
        if (w) {
            await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_WEAPON, fallback_lid: w.id, id: ""}, hooks);
        }
    }
    for (let g of [...data.loadout.gear, ...data.loadout.extendedGear]) {
        if (g) {
            await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_GEAR, fallback_lid: g.id, id: ""}, hooks);
        }
    }
    // Do loadout stuff
    pilot.ActiveMech = await pilot_inv.get_cat(EntryType.MECH).lookup_lid_live(ctx, data.active_mech); // Do an actor lookup. Note that we MUST do this AFTER syncing mechs
    pilot.Loadout = await PilotLoadout.unpack(data.loadout, pilot_inv, ctx); // Using reg stack here guarantees we'll grab stuff if we don't have it
    await pilot.Loadout.ready();

    // We writeback. We should still be in a stable state though, so no need to refresh
    await pilot.writeback();
    return { pilot, pilot_mechs };
}
