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
    MechWeapon,
    MechSystem,
    WeaponMod,
    Status,
    Frame,
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
    SourcedCounter,
    SyncHooks,
    AllHooks,
} from "@src/interface";
import {
    EntryType,
    InventoriedRegEntry,
    LiveEntryTypes,
    LoadOptions,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { bound_int, defaults, mech_cloud_sync, source_all_counters } from "@src/funcs";
import { get_user_id } from "@src/hooks";
import { CC_VERSION } from "@src/enums";
import {
    finding_iterate,
    fallback_obtain_ref,
    RegFallback,
    FALLBACK_WAS_INSINUATED,
} from "../regstack";
import { merge_defaults } from "../default_entries";

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
    special_equipment?: {
        PilotArmor: [],
        PilotWeapons: [],
        PilotGear: [],
        Frames: [],
        MechWeapons: [],
        WeaponMods: [],
        MechSystems: [],
        SystemMods: []
    },
    combat_history: {
        moves: 0,
        kills: 0,
        damage: 0,
        hp_damage: 0,
        structure_damage: 0,
        overshield: 0,
        heat_damage: 0,
        reactor_damage: 0,
        overcharge_uses: 0,
        core_uses: 0
    },
    loadout?: PackedPilotLoadoutData;
    loadouts?: PackedPilotLoadoutData[];
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
    ActiveMechRef!: RegRef<EntryType.MECH> | null;
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
    public get OwnedPilotArmor(): PilotArmor[] {
        return [...this._owned_armor];
    }

    private _owned_gear!: PilotGear[]; // We do not want people to mistakenly try to add to this - it is derived
    public get OwnedPilotGear(): PilotGear[] {
        return [...this._owned_gear];
    }

    private _owned_pilot_weapons!: PilotWeapon[]; // We do not want people to mistakenly try to add to this - it is derived
    public get OwnedPilotWeapons(): PilotWeapon[] {
        return [...this._owned_pilot_weapons];
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
    
    // These are posessed systems/weapons/etc of the mech that are not necessarily equipped.
    // Since the pilot truly owns these items, they are stored on the pilot to prevent deduplication between different mechs
    // Everything in MechLoadout should just be reffing to these items (avoid making duplicates - an easy mistake to make but one that will ultimately become very annoying)

    private _owned_mech_weapons!: MechWeapon[];
    public get OwnedMechWeapons(): MechWeapon[] {
        return [...this._owned_mech_weapons];
    }

    private _owned_systems!: MechSystem[];
    public get OwnedSystems(): MechSystem[] {
        return this._owned_systems;
    }

    private _owned_weapon_mods!: WeaponMod[];
    public get OwnedWeaponMods(): WeaponMod[] {
        return this._owned_weapon_mods;
    }

    private _owned_frames!: Frame[];
    public get OwnedFrames(): Frame[] {
        return this._owned_frames;
    }


    protected enumerate_owned_items(): RegEntry<any>[] {
        return [
            ...this._owned_pilot_weapons,
            ...this._owned_armor,
            ...this._owned_gear,
            ...this._core_bonuses,
            ...this._factions,
            ...this._skills,
            ...this._talents,
            ...this._reserves,
            ...this._orgs,
            ...this._licenses,
            ...this._owned_mech_weapons,
            ...this._owned_systems,
            ...this._owned_weapon_mods,
            ...this._owned_frames,
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
    public async Mechs(): Promise<Mech[]> {
        let all_mechs = await this.Registry.get_cat(EntryType.MECH).list_live(this.OpCtx);
        return all_mechs.filter(m => m.Pilot == this);
    }

    public async ActiveMech(opts?: LoadOptions): Promise<Mech | null> {
        return this.ActiveMechRef ? this.Registry.resolve(this.OpCtx, this.ActiveMechRef, opts) : null;
    }

    // Grabs counters from the pilot, their gear, their active mech, etc etc
    public get AllCounters(): SourcedCounter<EntryType.TALENT | EntryType.CORE_BONUS | EntryType.PILOT>[] {
        return [
            ...source_all_counters<EntryType.TALENT>(this.Talents),
            ...source_all_counters<EntryType.CORE_BONUS>(this.CoreBonuses),
            ...this.CustomCounters.map(c => c.mark_sourced<EntryType.PILOT>(this))
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
        merge_defaults(data, defaults.PILOT());
        let subreg = await this.get_inventory();
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
        this.Loadout = new PilotLoadout(subreg, this.OpCtx, data.loadout);
        this.MechSkills = new MechSkills(data.mechSkills);
        this.ActiveMechRef = data.active_mech;
        this.Mounted = data.mounted;
        this.Name = data.name;
        this.Notes = data.notes;
        this.Overshield = data.current_overshield;
        this.PlayerName = data.player_name;
        this.Portrait = data.portrait;
        this.SortIndex = data.sort_index;
        this.Status = data.status;
        this.TextAppearance = data.text_appearance;

        let _opt = {wait_ctx_ready: false};
        this._factions = await subreg.get_cat(EntryType.FACTION).list_live(this.OpCtx, _opt);
        this._core_bonuses = await subreg.get_cat(EntryType.CORE_BONUS).list_live(this.OpCtx, _opt);
        this._quirks = await subreg.get_cat(EntryType.QUIRK).list_live(this.OpCtx, _opt);
        this._licenses = await subreg.get_cat(EntryType.LICENSE).list_live(this.OpCtx, _opt);
        this._skills = await subreg.get_cat(EntryType.SKILL).list_live(this.OpCtx, _opt);
        this._reserves = await subreg.get_cat(EntryType.RESERVE).list_live(this.OpCtx, _opt);
        this._talents = await subreg.get_cat(EntryType.TALENT).list_live(this.OpCtx, _opt);
        this._orgs = await subreg.get_cat(EntryType.ORGANIZATION).list_live(this.OpCtx, _opt);
        this._owned_armor = await subreg.get_cat(EntryType.PILOT_ARMOR).list_live(this.OpCtx, _opt);
        this._owned_pilot_weapons = await subreg.get_cat(EntryType.PILOT_WEAPON).list_live(this.OpCtx, _opt);
        this._owned_gear = await subreg.get_cat(EntryType.PILOT_GEAR).list_live(this.OpCtx, _opt);
        this._owned_frames = await subreg.get_cat(EntryType.FRAME).list_live(this.OpCtx, _opt);
        this._owned_systems = await subreg.get_cat(EntryType.MECH_SYSTEM).list_live(this.OpCtx, _opt);
        this._owned_mech_weapons = await subreg.get_cat(EntryType.MECH_WEAPON).list_live(this.OpCtx, _opt);
        this._owned_weapon_mods = await subreg.get_cat(EntryType.WEAPON_MOD).list_live(this.OpCtx, _opt);
    }

    protected save_imp(): RegPilotData {
        return {
            active_mech: this.ActiveMechRef,
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

    public async emit(): Promise<PackedPilotData> {
        console.warn("We do not currently emit proper brew data when emitting pilots, or counter data");
        let mechs: PackedMechData[] = [];
        for(let mech of await this.Mechs()) {
            mechs.push(await mech.emit());
        }
        let skills: PackedRankedData[] = [];
        for(let skill of  this.Skills) {
            skills.push({
                id: skill.LID,
                rank: skill.CurrentRank,
                custom: false, // ???
                custom_desc: skill.Description,
                custom_detail: skill.Detail
            });
        }

        let talents: PackedRankedData[] = [];
        for(let talent of this.Talents) {
            talents.push({
                id: talent.LID,
                rank: talent.CurrentRank
            });
        }

       let licenses: PackedRankedData[] = [];
        for(let license of this.Licenses) {
            talents.push({
                id: license.Name,
                rank: license.CurrentRank
            });
        }



        return {
            background: this.Background,
            brews: [],
            callsign: this.Callsign,
            campaign: this.Campaign,
            cc_ver: CC_VERSION,
            cloudID: this.CloudID,
            cloudOwnerID: this.CloudOwnerID,
            cloud_portrait: this.CloudPortrait,
            combat_history: {
                core_uses: 0,
                damage: 0,
                heat_damage: 0,
                hp_damage: 0,
                kills: 0,
                moves: 0,
                overcharge_uses: 0,
                overshield: 0,
                reactor_damage: 0,
                structure_damage: 0
            },
            core_bonuses: this.CoreBonuses.map(cb => cb.LID),
            counter_data: [],
            current_hp: this.CurrentHP,
            custom_counters: [],
            factionID: this.Factions[0]?.LID,
            group: this.Group,
            history: this.History,
            id: this.LID,
            lastCloudUpdate: this.LastCloudUpdate,
            level: this.Level,
            mechSkills: [this.MechSkills.Hull, this.MechSkills.Agi, this.MechSkills.Sys, this.MechSkills.Eng],
            name: this.Name,
            mechs,
            notes: this.Notes,
            orgs: await SerUtil.emit_all(this.Orgs),
            player_name: this.PlayerName,
            portrait: this.Portrait,
            quirk: this.Quirks[0]?.Description ?? "",
            reserves: await SerUtil.emit_all(this.Reserves),
            skills,
            talents,
            licenses,
            sort_index: 0,
            status: this.Status,
            text_appearance: this.TextAppearance,
            loadout: await this.Loadout.emit(),
            state: {
                active_mech_id: this.ActiveMechRef?.fallback_lid ?? "",
                actions: 0,
                braced: false,
                bracedCooldown: false,
                deployed: [],
                mounted: false,
                overcharged: false,
                redundant: false,
                stage: "Combat",
                prepare: false,
                stats: {
                    core_uses: 0,
                    damage: 0,
                    heat_damage: 0,
                    hp_damage: 0,
                    kills: 0,
                    moves: 0,
                    overcharge_uses: 0,
                    overshield: 0,
                    reactor_damage: 0,
                    structure_damage: 0
                },
                turn: 0
            }
        }
    }
}


const noop = (..._: any) => {};

// Due to the nature of pilot data, and the fact that we generally desire to use this for synchronization of an existing pilot rather than as a one off compendium import,
// we define this separately. gather_source_regs is where we look if we can't find an item in the pilot that we expected - it will be added to the pilot
// If custom_pilot_inv, it will be used as the pilot's inventory registry. 
export async function cloud_sync(
    data: PackedPilotData,
    pilot: Pilot,
    fallback_source_regs: Registry[],
    hooks?: AllHooks,
): Promise<Pilot> {
    // Refresh the pilot
    let tmp_pilot = await pilot.refreshed();
    if (!tmp_pilot) {
        throw new Error("Pilot was unable to be refreshed. May have been deleted"); // This is fairly catastrophic
    }
    pilot = tmp_pilot;
    let pilot_inv = await tmp_pilot.get_inventory();

    // Stub out pre-edit with a noop
    hooks = hooks || {};

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

    // Fetch ALL registry + fallback stored licenses - need to inspect them to find frames
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
                let is_new = false;
                if (sl.Registry.name() != pilot_inv.name()) {
                    // Grab a copy for our pilot
                    sl = await sl.insinuate(pilot_inv, ctx, hooks);
                    is_new = true;
                }

                // Then update lvl and save
                sl.CurrentRank = cc_pilot_license.rank;
                // await (sync_hooks.sync_license ?? noop)(sl, cc_pilot_license, is_new);
                if(hooks.sync_license)
                    await hooks.sync_license(sl, cc_pilot_license, is_new);
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
        let is_new = false;

        if (!corr_mech) {
            // Seems like the pilot has a mech that we haven't accounted for yet. Make a new one and add it to our tracker
            corr_mech = await pilot_inv.get_cat(EntryType.MECH).create_default(ctx);
            pilot_mechs.push(corr_mech);
            is_new = true;
        }

        // Tell it we own/pilot it
        corr_mech.Pilot = pilot;

        // Apply
        await mech_cloud_sync(md, corr_mech, fallback_source_regs, hooks, is_new);
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

    // Look for faction. Create if not present. Do nothing otherwise. TODO: Handle when this has real data
    if (data.factionID) {
        if (!pilot.Factions.find(f => f.LID == data.factionID)) {
            let new_faction = await pilot_inv.create_live(EntryType.FACTION, ctx);
            new_faction.LID = data.factionID;
            // if(sync_hooks.sync_faction) 
                // await sync_hooks.sync_faction(new_faction, {id: data.factionID}, true); // TODO
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
    for (let data_cb of data.core_bonuses) {
        let cb = await fallback_obtain_ref(stack, ctx, {
            fallback_lid: data_cb,
            id: "",
            type: EntryType.CORE_BONUS,
        }, hooks);
        
        // Do a sync save writeback
        if(cb) {
            if(hooks.sync_core_bonus)
                await hooks.sync_core_bonus(cb, data, cb.Flags[FALLBACK_WAS_INSINUATED]);
            await cb.writeback();

            // Also deployables
            if(hooks.sync_deployable_nosave) {
                for(let d of cb.Deployables) {
                    await hooks.sync_deployable_nosave(d);
                }
            }
        }
    }

    // These are more user customized items, and need a bit more finagling (a bit like the mech)
    // For reserves, as they lack a meaningful way of identification we just clobber.
    for (let data_reserve of data.reserves) {
        // Though we could ref, almost always better to unpack due to custom data
        // TODO - don't clobber?
        for (let ur of pilot.Reserves) {
            ur.destroy_entry();
        }
        let reserve = await Reserve.unpack(data_reserve, pilot_inv, ctx);

        // Do a sync save writeback
        if(reserve) {
            if(hooks.sync_reserve)
                await hooks.sync_reserve(reserve, data_reserve, true);
            await reserve.writeback();

            // Also deployables
            if(hooks.sync_deployable_nosave) {
                for(let d of reserve.Deployables) {
                    await hooks.sync_deployable_nosave(d);
                }
            }
        }
    }

    // Skills, we try to find and if not create
    for (let data_skill of data.skills) {
        // Try to get/fetch pre-existing
        let skill = await fallback_obtain_ref(stack, ctx, {
            fallback_lid: data_skill.id,
            id: "",
            type: EntryType.SKILL
        }, hooks);
        let is_new = skill?.Flags[FALLBACK_WAS_INSINUATED] ?? false; // Track if this is new to the pilot, for hooks knowledge
        if (!skill) {
            // Make if we can
            if ((data_skill as PackedSkillData).custom) {
                skill = await Skill.unpack(data_skill as PackedSkillData, pilot_inv, ctx);
            } else {
                // Nothing we can do for this one - ignore
                console.warn("Unrecognized skill: " + data_skill.id);
                continue;
            }
        }

        // Can set rank regardless
        skill.CurrentRank = data_skill.rank ?? skill.CurrentRank;

        // Details require custom
        if ((data_skill as PackedSkillData).custom) {
            let ss = data_skill as PackedSkillData;
            skill.Description = ss.custom_desc ?? skill.Description;
            skill.Detail = ss.custom_detail ?? skill.Detail;
        }

        // Do a sync save writeback
        if(hooks.sync_trigger) 
            hooks.sync_trigger(skill, data_skill, is_new);
        await skill.writeback();
    }

    // Fetch talents. Also need to update rank. Due nothing to missing
    for (let data_talent of data.talents) {
        let talent = await fallback_obtain_ref(stack, ctx, {
            type: EntryType.TALENT,
            fallback_lid: data_talent.id,
            id: ""
        }, hooks);
        if (talent) {
            // Update rank
            talent.CurrentRank = data_talent.rank;

            // Do a sync save writeback
            if(hooks.sync_talent)
                await hooks.sync_talent(talent, data_talent, talent.Flags[FALLBACK_WAS_INSINUATED]);
            await talent.writeback();

            // Also deployables
            if(hooks.sync_deployable_nosave) {
                for(let d of talent.Deployables) {
                    await hooks.sync_deployable_nosave(d);
                }
            }
        }
    }

    // Look for org matching existing orgs. Create if not present. Do nothing to unmatched
    for (let org of data.orgs) {
        let corr_org = pilot.Orgs.find(o => o.Name == org.name);
        let is_new = false;
        if (!corr_org) {
            // Make a new one
            corr_org = await pilot_inv.get_cat(EntryType.ORGANIZATION).create_default(ctx);
            is_new = true;
        }

        // Update / init
        corr_org.Actions ??= org.actions;
        corr_org.Description ??= org.description;
        corr_org.Efficiency ??= org.efficiency;
        corr_org.Influence ??= org.influence;
        corr_org.Name ??= org.name;
        corr_org.Purpose ??= org.purpose;

        // hook/writeback
        if(hooks.sync_organization)
            await hooks.sync_organization(corr_org, org, is_new);
        await corr_org.writeback();
    }

    // Sync counters
    for (let c of pilot.AllCounters) {
        c.counter.sync_state_from(data.counter_data);
    }

    // Fetch all weapons, armor, gear we will need
    let loadout: PackedPilotLoadoutData | null = null;
    if(data.loadout) {
        loadout = data.loadout;
    } else if(data.loadouts && data.loadouts.length) {
        loadout = data.loadouts[0];
    }

    // Do loadout stuff
    if(loadout) {
        for (let data_armor of loadout.armor) {
            if (data_armor) {
                let armor = await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_ARMOR, fallback_lid: data_armor.id, id: ""}, hooks);
                // TODO: sync armor uses
                if(armor) {
                    if(hooks.sync_pilot_armor)
                        await hooks.sync_pilot_armor(armor, data_armor, armor.Flags[FALLBACK_WAS_INSINUATED]);
                    await armor.writeback();

                    // Also deployables
                    if(hooks.sync_deployable_nosave) {
                        for(let d of armor.Deployables) {
                            await hooks.sync_deployable_nosave(d);
                        }
                    }
                }
            }
        }
        for (let data_weapon of [...loadout.weapons, ...loadout.extendedWeapons]) {
            if (data_weapon) {
                let weapon = await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_WEAPON, fallback_lid: data_weapon.id, id: ""}, hooks);
                // TODO: sync weapon uses/loaded
                if(weapon) {
                    if(hooks.sync_pilot_weapon)
                        await hooks.sync_pilot_weapon(weapon, data_weapon, weapon.Flags[FALLBACK_WAS_INSINUATED]);
                    await weapon.writeback();

                    // Also deployables
                    if(hooks.sync_deployable_nosave) {
                        for(let d of weapon.Deployables) {
                            await hooks.sync_deployable_nosave(d);
                        }
                    }
                }
            }
        }
        for (let data_gear of [...loadout.gear, ...loadout.extendedGear]) {
            if (data_gear) {
                let gear = await fallback_obtain_ref(stack, ctx, {type: EntryType.PILOT_GEAR, fallback_lid: data_gear.id, id: ""}, hooks);
                // TODO: sync gear uses
                if(gear){ 
                    if(hooks.sync_pilot_gear)
                        await hooks.sync_pilot_gear(gear, data_gear, gear.Flags[FALLBACK_WAS_INSINUATED]);
                    await gear.writeback();

                    // Also deployables
                    if(hooks.sync_deployable_nosave) {
                        for(let d of gear.Deployables) {
                            await hooks.sync_deployable_nosave(d);
                        }
                    }
                }
            }
        }
        pilot.Loadout = await PilotLoadout.unpack(loadout, pilot_inv, ctx); // Using reg stack here guarantees we'll grab stuff if we don't have it
        await pilot.Loadout.load_done();

        // Hook, no writeback (would be meaningless)
        if(hooks.sync_pilot_loadout) {
            await hooks.sync_pilot_loadout(pilot.Loadout, loadout, true);
        }
    }
    let ami = data.state?.active_mech_id ?? (data as any).active_mech;
    if(ami) {
        pilot.ActiveMechRef = {
            fallback_lid: ami,
            id: "",
            type: EntryType.MECH,
            reg_name: pilot_inv.name()
        }; 
    } else  {
        pilot.ActiveMechRef = null;
    }

    // We writeback. 
    if(hooks.sync_pilot)
        await hooks.sync_pilot(pilot, data, false);
    await pilot.writeback();

    // Final refresh-check, just in case
    tmp_pilot = await pilot.refreshed();
    if (!tmp_pilot) {
        throw new Error("Pilot was unable to be refreshed. May have been deleted"); // This is fairly catastrophic
    }
    return tmp_pilot;
}
