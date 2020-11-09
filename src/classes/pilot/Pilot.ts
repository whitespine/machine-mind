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
} from "@src/class";
import * as gistApi from "@src/io/apis/gist";
import {
    IActionData,
    IOrganizationData,
    IRankedData,
    PackedReserveData,
    PackedMechData,
    PackedCounterSaveData,
    PackedCounterData,
    IMechState,
    PackedPilotLoadoutData,
    RegCounterData,
} from "@src/interface";
import {
    EntryType,
    InventoriedRegEntry,
    LiveEntryTypes,
    quick_mm_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
} from "@src/registry";
import { PackedPilotEquipmentState, RegPilotLoadoutData } from "./PilotLoadout";
import { bound_int, mech_cloud_sync } from "@src/funcs";
import { PilotArmor, PilotEquipment, PilotGear, PilotWeapon } from "./PilotEquipment";
import { get_user_id } from "@src/hooks";
import { RegStack } from "../regstack";

// Note: we'll need to mogrify our pilot data a little bit to coerce it to this form

interface BothPilotData {
    id: string;
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
    licenses: IRankedData[];
    skills: IRankedData[];
    talents: IRankedData[];
    reserves: PackedReserveData[];
    orgs: IOrganizationData[];
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
    active_mech: RegRef<EntryType.MECH> | null;

    faction: RegRef<EntryType.FACTION> | null; // I mostly made these first-class entities because I thought faction-membership bonuses/reserves would be kinda cool...
    organizations: RegRef<EntryType.ORGANIZATION>[];
    quirk: RegRef<EntryType.QUIRK> | null;

    // Since mechs are themselves actors we don't need to cascade item ownership - just actor ownership
    mechs: RegRef<EntryType.MECH>[];

    // We do own these, though
    skills: RegRef<EntryType.SKILL>[];
    talents: RegRef<EntryType.TALENT>[];
    core_bonuses: RegRef<EntryType.CORE_BONUS>[];
    custom_counters: RegCounterData[];

    // Contains refs to our equpment, which we still own independently
    loadout: RegPilotLoadoutData;

    // the equip on our pilot
    owned_weapons: RegRef<EntryType.PILOT_WEAPON>[];
    owned_armor: RegRef<EntryType.PILOT_ARMOR>[];
    owned_gear: RegRef<EntryType.PILOT_GEAR>[];

    // We don't really track active state much here. We do at least track mounted state
    mounted: boolean;
}

export class Pilot extends InventoriedRegEntry<EntryType.PILOT, RegPilotData> {
    // Identity
    ID!: string; // As with all ids
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
    Faction!: Faction | null;
    Quirk!: Quirk | null;

    CloudID!: string;
    CloudOwnerID!: string;
    CloudPortrait!: string;
    LastCloudUpdate!: string;

    Level!: number;
    Status!: string; // I honestly have no idea what this is
    CurrentHP!: number;
    Loadout!: PilotLoadout;
    ActiveMech!: Mech | null;
    Mounted!: boolean;
    // State!: ActiveState;

    MechSkills!: MechSkills;
    Skills!: Skill[];
    Talents!: Talent[];
    Licenses!: License[];
    CoreBonuses!: CoreBonus[];

    Mechs!: Mech[];
    CustomCounters!: Counter[];

    Reserves!: Reserve[];
    Orgs!: Organization[];

    // These are the weapons and stuff that we _own_, not necessarily that is currently in our loudout
    // However, our loadout should exclusively refer to items held herein
    OwnedWeapons!: PilotWeapon[];
    OwnedArmor!: PilotArmor[];
    OwnedGear!: PilotGear[];

    // The version of compcon that produced this
    CCVersion!: string;

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

    // Adding and removing skills should really function no differently than any other thing
    /*
  public CanAddSkill(skill: Skill | CustomSkill): boolean {
    if (this._level === 0) {
      return this._skills.length < Rules.MinimumPilotSkills && !this.has('Skill', skill.ID)
    } else {
      const underLimit = this.CurrentSkillPoints < this.MaxSkillPoints
      if (!this.has('Skill', skill.ID) && underLimit) return true
      const pSkill = this._skills.find(x => x.Skill.ID === skill.ID)
      return underLimit && pSkill && pSkill.Rank < Rules.MaxTriggerRank
    }
  }

  public AddSkill(skill: Skill | CustomSkill): void {
    const index = this._skills.findIndex(x => _.isEqual(x.Skill, skill))
    if (index === -1) {
      this._skills.push(new PilotSkill(skill))
    } else {
      this._skills[index].Increment()
    }
    this.save()
  }

  public AddCustomSkill(cs: { skill: string; description: string; detail: string }): void {
    this.AddSkill(new CustomSkill(cs.skill, cs.description, cs.detail))
  }

  public CanRemoveSkill(skill: Skill | CustomSkill): boolean {
    return this.has('Skill', skill.ID)
  }

  public RemoveSkill(skill: Skill | CustomSkill): void {
    const index = this._skills.findIndex(x => x.Skill.ID === skill.ID)
    if (index === -1) {
      console.error(`Skill Trigger "${skill.Name}" does not exist on Pilot ${this.Callsign}`)
    } else {
      if (this._skills[index].Rank > 1) {
        this._skills[index].Decrement()
      } else {
        this._skills.splice(index, 1)
      }
    }
    this.save()
  }
  */

    /*
    public ClearSkills(): void {
        for (let i = this._skills.length - 1; i >= 0; i--) {
            while (this._skills[i]) {
                this.RemoveSkill(this._skills[i].Skill);
            }
        }
    }
    */

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

    // Adding and removing talents should really function no differently than any other thing
    /*
  public AddTalent(talent: Talent): void {
    const index = this._talents.findIndex(x => _.isEqual(x.Talent, talent))
    if (index === -1) {
      this._talents.push(new PilotTalent(talent))
    } else {
      this._talents[index].Increment()
    }
    this.talentSort()
    this.updateIntegratedTalents()
    this.save()
  }

  public RemoveTalent(talent: Talent): void {
    const index = this._talents.findIndex(x => _.isEqual(x.Talent, talent))
    if (index === -1) {
      console.error(`Talent "${talent.Name}" does not exist on Pilot ${this.Callsign}`)
    } else {
      if (this._talents[index].Rank > 1) {
        this._talents[index].Decrement()
      } else {
        this._talents.splice(index, 1)
      }
    }
    this.talentSort()
    this.updateIntegratedTalents()
    this.save()
  }
  */

    /*
    public ClearTalents(): void {
        for (let i = this._talents.length - 1; i >= 0; i--) {
            while (this._talents[i]) {
                this.RemoveTalent(this._talents[i].Talent);
            }
        }
    }
    */

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
            x => x.Manufacturer.ID.toLowerCase() === manufacturerID.toLowerCase()
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

    /*

    public AddLicense(license: License): void {
        const index = this.Licenses.findIndex(x => _.isEqual(x.License, license));
        if (index === -1) {
            this.Licenses.push(new PilotLicense(license, 1));
        } else {
            this.Licenses[index].Increment();
        }
        this.save();
    }

    public RemoveLicense(license: License): void {
        const index = this.Licenses.findIndex(x => _.isEqual(x.License, license));
        if (index === -1) {
            console.error(
                `License "${license.ToString()}" does not exist on Pilot ${this.Callsign}`
            );
        } else {
            if (this.Licenses[index].Rank > 1) {
                this.Licenses[index].Decrement();
            } else {
                this.Licenses.splice(index, 1);
            }
        }
        this.save();
    }

    public ClearLicenses(): void {
        for (let i = this.Licenses.length - 1; i >= 0; i--) {
            while (this.Licenses[i]) {
                this.RemoveLicense(this.Licenses[i].License);
            }
        }
    }
    */

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

    // -- Downtime Reserves -------------------------------------------------------------------------
    /*
    public RemoveReserve(index: number): void {
        this._reserves.splice(index, 1);
        this.save();
    }

    public get Organizations(): Organization[] {
        return this._orgs;
    }

    public set Organizations(orgs: Organization[]) {
        this._orgs = orgs;
        this.save();
    }

    public RemoveOrganization(index: number): void {
        this._orgs.splice(index, 1);
        this.save();
    }
    */
    // -- Mechs -----------------------------------------------------------------------------------
    /*
    public get Mounted(): boolean {
        if (!this.ActiveMech) return false;
        if (
            this.ActiveMech.Destroyed ||
            this.ActiveMech.ReactorDestroyed ||
            this.ActiveMech.Ejected
        )
            return false;
        return this._mounted;
    }
    */

    // Grabs counters from the pilot, their gear, their active mech, etc etc
    public get Counters(): Counter[] {
        return [
            ...this.Talents.flatMap(t => t.Counters),
            ...this.CoreBonuses.flatMap(cb => cb.Counters),
            ...(this.ActiveMech?.MechCounters || []),
            ...this.CustomCounters,
        ];
    }

    // Lists all of the bonuses this unmounted pilot is receiving
    public get PilotBonuses(): Bonus[] {
        return [
            ...this.Talents.flatMap(t => t.Bonuses),
            ...this.CoreBonuses.flatMap(cb => cb.Bonuses),
            ...this.Loadout.Items.flatMap(i => i.Bonuses),
            ...(this.Quirk ? this.Quirk.Bonuses : []),
            // ...(this.Faction ? this.Faction.Bonuses : []),
            ...this.Reserves.flatMap(r => r.Bonuses),
            ...this.MechSkills.AllBonuses,
        ];
    }

    // Sum our pilot bonuses for the specified id, return the number
    private sum_bonuses(id: string): number {
        return Bonus.SumPilotBonuses(this, this.PilotBonuses, id);
    }

    public async load(data: RegPilotData): Promise<void> {
        let subreg = await this.inventory_reg();
        this.ActiveMech = data.active_mech ? await subreg.resolve(data.active_mech) : null;
        this.Background = data.background;
        this.Callsign = data.callsign;
        this.Campaign = data.campaign;
        this.CCVersion = data.cc_ver;
        this.CloudID = data.cloudID;
        this.CloudOwnerID = data.cloudOwnerID;
        this.CloudPortrait = data.cloud_portrait;
        this.CoreBonuses = await subreg.resolve_many(data.core_bonuses);
        this.CurrentHP = data.current_hp;
        this.CustomCounters = SerUtil.process_counters(data.custom_counters);
        this.Faction = data.faction ? await subreg.resolve(data.faction) : null;
        this.Group = data.group;
        this.History = data.history;
        this.ID = data.id;
        this.LastCloudUpdate = data.lastCloudUpdate;
        this.Level = data.level;
        this.Loadout = await new PilotLoadout(subreg, data.loadout).ready();
        this.MechSkills = new MechSkills(data.mechSkills);
        this.Mechs = await subreg.resolve_many(data.mechs);
        this.Mounted = data.mounted;
        this.Name = data.name;
        this.Notes = data.notes;
        this.Orgs = await subreg.resolve_many(data.organizations);
        this.OwnedArmor = await subreg.resolve_many(data.owned_armor);
        this.OwnedWeapons = await subreg.resolve_many(data.owned_weapons);
        this.OwnedGear = await subreg.resolve_many(data.owned_gear);
        this.PlayerName = data.player_name;
        this.Portrait = data.portrait;
        this.Quirk = data.quirk ? await subreg.resolve(data.quirk) : null;
        this.Skills = await subreg.resolve_many(data.skills);
        this.SortIndex = data.sort_index;
        this.Status = data.status;
        this.Talents = await subreg.resolve_many(data.talents);
        this.TextAppearance = data.text_appearance;
    }

    public async save(): Promise<RegPilotData> {
        return {
            active_mech: this.ActiveMech?.as_ref() ?? null,
            background: this.Background,
            callsign: this.Callsign,
            campaign: this.Campaign,
            cc_ver: this.CCVersion,
            cloudID: this.CloudID,
            cloudOwnerID: this.CloudOwnerID,
            cloud_portrait: this.CloudPortrait,
            core_bonuses: SerUtil.ref_all(this.CoreBonuses),
            current_hp: this.CurrentHP,
            custom_counters: SerUtil.sync_save_all(this.CustomCounters),
            faction: this.Faction?.as_ref() ?? null,
            group: this.Group,
            history: this.History,
            id: this.ID,
            lastCloudUpdate: this.LastCloudUpdate,
            level: this.Level,
            loadout: await this.Loadout.save(),
            mechSkills: this.MechSkills.save(),
            mechs: SerUtil.ref_all(this.Mechs),
            mounted: this.Mounted,
            name: this.Name,
            notes: this.Notes,
            organizations: SerUtil.ref_all(this.Orgs),
            owned_armor: SerUtil.ref_all(this.OwnedArmor),
            owned_gear: SerUtil.ref_all(this.OwnedGear),
            owned_weapons: SerUtil.ref_all(this.OwnedWeapons),
            player_name: this.PlayerName,
            portrait: this.Portrait,
            quirk: this.Quirk?.as_ref() ?? null,
            skills: SerUtil.ref_all(this.Skills),
            sort_index: this.SortIndex,
            status: this.Status,
            talents: SerUtil.ref_all(this.Talents),
            text_appearance: this.TextAppearance,
        };
    }

    public get_child_entries(): RegEntry<any, any>[] {
        let result: RegEntry<any, any>[] = [
            ...this.CoreBonuses,
            ...this.Licenses,
            ...this.Reserves,
            ...this.Skills,
            ...this.Talents,
            ...this.Orgs,
            ...this.Mechs,
            ...this.OwnedArmor,
            ...this.OwnedWeapons,
            ...this.OwnedGear,
        ];
        if (this.Quirk) result.push(this.Quirk);
        if (this.Faction) result.push(this.Faction);
        return result;
    }
}

// Due to the nature of pilot data, and the fact that we generally desire to use this for synchronization of an existing pilot rather than as a one off compendium import,
// we define this separately. compendium_reg is where we look if we can't find an item in the pilot that we expected
// TODO: Figure out a way to handle cases where the pilot has multiple copies of the same system by mmid (e.g. "lefty" and "righty" on knives or something)- in this case it will always just pick the first it finds
export async function cloud_sync(
    data: PackedPilotData,
    pilot: Pilot,
    compendium_reg: Registry
): Promise<void> {
    // The simplest way to do this is to, for each entry, just look in a regstack and insinuate to the pilot inventory.
    // if the item was already in the pilot inventory, then no harm!. If not, it is added.
    let pilot_inv = await pilot.inventory_reg();
    let reg_stack = new RegStack([pilot_inv, compendium_reg]);

    // Track all items that we hit
    let untouched_children = new Set(pilot.get_child_entries());

    // Identity
    pilot.ID = data.id;
    pilot.Name = data.name;
    pilot.Callsign = data.callsign;
    pilot.PlayerName = data.player_name;
    pilot.Background = data.background;
    pilot.Notes = data.notes;
    pilot.History = data.history;
    pilot.Portrait = data.portrait; // Should this be a link or something? Mayabe just not sync it?
    pilot.TextAppearance = data.text_appearance;

    // Do mechs first.
    for (let md of data.mechs) {
        let corr_mech = pilot.Mechs.find(m => m.ID == md.id);
        if (!corr_mech) {
            // Make a new one
            corr_mech = await pilot_inv.get_cat(EntryType.MECH).create_default();
            // Add it to the pilot
            pilot.Mechs.push(corr_mech);
        } else {
            // We had found it - mark that it's still there
            untouched_children.delete(corr_mech);
        }
        // Apply
        await mech_cloud_sync(md, corr_mech, compendium_reg);
    }

    // Try to find a quirk that matches, or create if not present
    // TODO: this is weird. compcon doesn't really do quirks. For now we just make new quirk if the quirk descriptions don't match?
    if (data.quirk) {
        if (pilot.Quirk) {
            // Quirk still there - mark
            untouched_children.delete(pilot.Quirk);

            // Update the description if need be
            pilot.Quirk.Description = data.quirk;
        } else {
            //Make new quirk
            let new_quirk = await Quirk.unpack(data.quirk, pilot_inv);
            pilot.Quirk = new_quirk;
        }
    }

    // Meta pilot grouping. Pretty trivial
    pilot.Group = data.group;
    pilot.SortIndex = data.sort_index;
    pilot.Campaign = data.campaign;

    // Look for faction. Create if not present
    if (data.factionID) {
        if (pilot.Faction) {
            untouched_children.delete(pilot.Faction);

            // For the time being all we have is the faction id. We cannot transfer any other information
            pilot.Faction.ID = pilot.ID;
        }
        // If they don't match/don't exist, break out
        if (!pilot.Faction || pilot.Faction.ID != data.factionID) {
            // Gotta make a new faction
            // Delete if no match??? Generally not a fan of deleting lore items as they're unlikely to really bloat things much and tend to take a lot of player work to fill in to be cool
            pilot.Faction = await Faction.unpack(
                {
                    color: "grey",
                    description: "",
                    id: data.factionID,
                    logo: "",
                    name: data.factionID,
                    logo_url: "",
                },
                pilot_inv
            );
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

    // Get equipment and stuff. These are "guaranteed" to be in the compendium
    pilot.CoreBonuses = await reg_stack.resolve_many(
        data.core_bonuses.map(cb => quick_mm_ref(EntryType.CORE_BONUS, cb))
    );
    pilot.CoreBonuses.forEach(cb => untouched_children.delete(cb));
    pilot.Licenses = await reg_stack.resolve_many(
        data.licenses.map(l => quick_mm_ref(EntryType.LICENSE, l.id))
    );
    pilot.Licenses.forEach(l => untouched_children.delete(l));
    pilot.Talents = await reg_stack.resolve_many(
        data.talents.map(x => quick_mm_ref(EntryType.TALENT, x.id))
    );
    pilot.Talents.forEach(x => untouched_children.delete(x));

    // These are more user customized items, and need a bit more finagling (a bit like the mech)
    // TODO: Do what I just described
    pilot.Reserves = await reg_stack.resolve_many(
        data.reserves.map(x => quick_mm_ref(EntryType.RESERVE, x.id))
    );
    pilot.Reserves.forEach(x => untouched_children.delete(x));
    pilot.Skills = await reg_stack.resolve_many(
        data.skills.map(x => quick_mm_ref(EntryType.SKILL, x.id))
    );
    pilot.Skills.forEach(x => untouched_children.delete(x));
    pilot.Orgs = await reg_stack.resolve_many(
        data.orgs.map(x => quick_mm_ref(EntryType.ORGANIZATION, x.name))
    );
    pilot.Orgs.forEach(x => untouched_children.delete(x));

    // Fixup ranks in ranked item
    for (let rank of data.skills) {
        let corr = pilot.Skills.find(x => x.ID == rank.id);
        if (corr) {
            corr.CurrentRank = rank.rank;
        }
    }
    for (let rank of data.talents) {
        let corr = pilot.Talents.find(x => x.ID == rank.id);
        if (corr) {
            corr.CurrentRank = rank.rank;
        }
    }
    for (let rank of data.licenses) {
        let corr = pilot.Licenses.find(x => x.Name == rank.id);
        if (corr) {
            corr.CurrentRank = rank.rank;
        }
    }

    // Sync counters
    for (let c of pilot.Counters) {
        c.sync_state_from(data.counter_data);
    }

    // Do loadout stuff
    pilot.ActiveMech = await pilot_inv.get_cat(EntryType.MECH).lookup_mmid(data.active_mech); // Do an actor lookup. Note that we MUST do this AFTER syncing mechs
    pilot.Loadout = await PilotLoadout.unpack(data.loadout, reg_stack); // Using reg stack here guarantees we'll grab stuff if we don't have it

    // We don't remove old owned pilot equipment, but we do update our loadout and ensure that everything in it is also marked as an owned item
    async function loadout_resolver<
        T extends EntryType.PILOT_ARMOR | EntryType.PILOT_GEAR | EntryType.PILOT_WEAPON
    >(loadout_array: Array<LiveEntryTypes<T> | null>, owned_list: LiveEntryTypes<T>[]) {
        for (let x of loadout_array) {
            if (x) {
                untouched_children.delete(x);
                if (!owned_list.includes(x)) {
                    owned_list.push(x);
                }
            }
        }
    }
    loadout_resolver(pilot.Loadout.Armor, pilot.OwnedArmor);
    loadout_resolver(pilot.Loadout.Gear, pilot.OwnedGear);
    loadout_resolver(pilot.Loadout.Weapons, pilot.OwnedWeapons);
    loadout_resolver(pilot.Loadout.ExtendedWeapons, pilot.OwnedWeapons);
    loadout_resolver(pilot.Loadout.ExtendedGear, pilot.OwnedGear);

    //  TODO: Decide what we want to do with untouched children
    for (let x of untouched_children) {
        console.log(`${x.Type}:${x.RegistryID}:${(x as any).Name} seems to no longer be needed.`);
    }

    // We always want to insinuate and writeback to be sure we own all of these items
    await pilot.insinuate(pilot_inv);
    await pilot.writeback();
}
