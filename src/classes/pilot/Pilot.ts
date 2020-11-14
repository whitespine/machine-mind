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
    PackedSkillData,
} from "@src/interface";
import {
    EntryType,
    InventoriedRegEntry,
    LiveEntryTypes,
    OpCtx,
    quick_mm_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
} from "@src/registry";
import { PackedPilotEquipmentState, RegPilotLoadoutData } from "./PilotLoadout";
import { bound_int, defaults, mech_cloud_sync } from "@src/funcs";
import { PilotArmor, PilotEquipment, PilotGear, PilotWeapon } from "./PilotEquipment";
import { get_user_id } from "@src/hooks";
import { CC_VERSION } from '../enums';
import { skills } from 'lancer-data';
import { SSL_OP_SINGLE_DH_USE } from 'constants';
import { CovetousReg } from '../regstack';

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
    skills: Array<IRankedData | (PackedSkillData & {custom: true})>;
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

    // factions: RegRef<EntryType.FACTION>[]; // I mostly made these first-class entities because I thought faction-membership bonuses/reserves would be kinda cool...
    // organizations: RegRef<EntryType.ORGANIZATION>[];
    // quirks: RegRef<EntryType.QUIRK>[];

    // Since mechs are themselves actors we don't need to cascade item ownership - just actor ownership
    // We DO actually need a ref to these as ownership amidst the mech category is generally ambiguous
    mechs: RegRef<EntryType.MECH>[];

    // We do own these, though
    // skills: RegRef<EntryType.SKILL>[];
    // talents: RegRef<EntryType.TALENT>[];
    // core_bonuses: RegRef<EntryType.CORE_BONUS>[];
    custom_counters: RegCounterData[];

    // Contains refs to our equpment, which we still own independently
    loadout: RegPilotLoadoutData;

    // the equip on our pilot
    // licenses: RegRef<EntryType.LICENSE>[];
    // owned_weapons: RegRef<EntryType.PILOT_WEAPON>[];
    // owned_armor: RegRef<EntryType.PILOT_ARMOR>[];
    // owned_gear: RegRef<EntryType.PILOT_GEAR>[];

    // We don't really track active state much here. We do at least track mounted state
    mounted: boolean;
}

export class Pilot extends InventoriedRegEntry<EntryType.PILOT> {
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


    Mechs!: Mech[];
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
            x => x.Manufacturer?.ID.toLowerCase() === manufacturerID.toLowerCase()
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
            ...this.Quirks.flatMap(q => q.Bonuses),
            ...this.Factions.flatMap(f => []), // TODO - flesh out factions
            ...this.Reserves.flatMap(r => r.Bonuses),
            ...this.MechSkills.AllBonuses,
        ];
    }

    // Sum our pilot bonuses for the specified id, return the number
    private sum_bonuses(id: string): number {
        return Bonus.SumPilotBonuses(this, this.PilotBonuses, id);
    }

    public async load(data: RegPilotData): Promise<void> {
        // let data = {...defaults.PILOT(), ...
        let subreg = this.get_inventory();
        this.ActiveMech = data.active_mech ? await subreg.resolve(this.OpCtx, data.active_mech) : null;
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
        this.ID = data.id;
        this.LastCloudUpdate = data.lastCloudUpdate;
        this.Level = data.level;
        this.Loadout = await new PilotLoadout(subreg, this.OpCtx, data.loadout).ready();
        this.MechSkills = new MechSkills(data.mechSkills);
        this.Mechs = await subreg.resolve_many( this.OpCtx, data.mechs);
        this.Mounted = data.mounted;
        this.Name = data.name;
        this.Notes = data.notes;
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
        this._owned_weapons =await subreg.get_cat(EntryType.PILOT_WEAPON).list_live(this.OpCtx); 
        this._owned_gear = await subreg.get_cat(EntryType.PILOT_GEAR).list_live(this.OpCtx);
    }

    public async save(): Promise<RegPilotData> {
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
            custom_counters: SerUtil.sync_save_all(this.CustomCounters),
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
            player_name: this.PlayerName,
            portrait: this.Portrait,
            sort_index: this.SortIndex,
            status: this.Status,
            text_appearance: this.TextAppearance,
        };
    }

    public get_child_entries(): RegEntry<any>[] {
        let result: RegEntry<any>[] = [
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
        return result;
    }
}

// Due to the nature of pilot data, and the fact that we generally desire to use this for synchronization of an existing pilot rather than as a one off compendium import,
// we define this separately. compendium_reg is where we look if we can't find an item in the pilot that we expected
// TODO: Figure out a way to handle cases where the pilot has multiple copies of the same system by mmid (e.g. "lefty" and "righty" on knives or something)- in this case it will always just pick the first it finds
// TODO: Don't just nuke reserves, do something fancier
export async function cloud_sync(
    data: PackedPilotData,
    pilot: Pilot,
    compendium_reg: Registry
): Promise<void> {
    // Refresh the pilot
    let tmp_pilot = await pilot.refreshed();
    if(!tmp_pilot) {
        return;
    }
    pilot = tmp_pilot;

    // The simplest way to do this is to, for each entry, just look in a regstack and insinuate to the pilot inventory.
    // if the item was already in the pilot inventory, then no harm!. If not, it is added.
    let pilot_inv = pilot.get_inventory();
    // let reg_stack = new RegStack([pilot_inv, compendium_reg]);
    let covetous = new CovetousReg(pilot_inv, [compendium_reg]);
    let ctx = pilot.OpCtx;
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

    // Fetch licenses. Need to do before mech or else itll fail to get its equipment from the pilot. Also need to update rank 
    let license_ctx = new OpCtx();
    for(let t of data.licenses) {
        // Find the corresponding mech
        let found_mech = await compendium_reg.get_cat(EntryType.FRAME).lookup_mmid(license_ctx, t.id);

        if(found_mech) {
            // Get the pilot licenses
            let owned_licenses = await pilot_inv.get_cat(EntryType.LICENSE).list_live(ctx);

            // We use the mech name as the license names
            let found_license = owned_licenses.find(l => l.Name == found_mech?.Name);

            // If we did not find, we attempt to look in the compendium
            if(!found_license) {
                let all_licenses = await compendium_reg.get_cat(EntryType.LICENSE).list_live(license_ctx);
                found_license = all_licenses.find(l => l.Name == found_mech?.Name);
                found_license = await found_license?.insinuate(pilot_inv);
            }

            // If we have at this point found, update rank and writeback
            if(found_license) {
                // Update rank
                found_license.CurrentRank= t.rank;
                await found_license.writeback();
            }
        }
    }


    // Then do mechs
    for (let md of data.mechs) {
        let corr_mech = pilot.Mechs.find(m => m.ID == md.id);
        if (!corr_mech) {
            // Make a new one
            corr_mech = await pilot_inv.get_cat(EntryType.MECH).create_default(ctx);
            // Add it to the pilot
            pilot.Mechs.push(corr_mech);
        }
        // Apply
        await mech_cloud_sync(md, corr_mech, compendium_reg);
    }

    // Try to find a quirk that matches, or create if not present
    // TODO: this is weird. compcon doesn't really do quirks. For now we just make new quirk if the quirk descriptions don't match?
    if (data.quirk) {
        if(!pilot.Quirks.find(q => q.Description  == data.quirk)) {
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
        if(!pilot.Factions.find(f => f.ID == data.factionID)) {
            let new_faction = await pilot_inv.create(EntryType.FACTION, ctx);
            new_faction.ID = data.factionID;
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
    await covetous.resolve_many(ctx, data.core_bonuses.map(cb => quick_mm_ref(EntryType.CORE_BONUS, cb)));

    // These are more user customized items, and need a bit more finagling (a bit like the mech)
    // For reserves, as they lack a meaningful way of identification we just clobber.
    for(let r of data.reserves) {
        // Though we could ref, almost always better to unpack due to custom data
        // TODO - don't clobber?
        for(let ur of pilot.Reserves) {
            ur.destroy_entry();
        }
        await Reserve.unpack(r, pilot_inv, ctx);
    }

    // Skills, we try to find and if not create
    for(let s of data.skills) {
        // Try to get/fetch pre-existing
        let found = await covetous.resolve(ctx, quick_mm_ref(EntryType.SKILL, s.id));
        if(!found) {
            // Make if we can
            if((s as PackedSkillData).custom) {
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
        if((s as PackedSkillData).custom) {
            let ss = s as PackedSkillData;
            found.Description = ss.custom_desc ?? found.Description ;
            found.Detail = ss.custom_detail ?? found.Detail;
        }

        // Save
        await found.writeback();
    }

    // Fetch talents. Also need to update rank. Due nothing to missing
    for(let t of data.talents) {
        let found = await covetous.resolve(ctx, quick_mm_ref(EntryType.TALENT, t.id));
        if(found) {
            // Update rank
            found.CurrentRank= t.rank;
            found.writeback();
        }
    }

    // Look for org matching existing orgs. Create if not present. Do nothing to unmatched
    for(let org of data.orgs) {
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

    // Get all weapons we will need
    let armor_refs = data.loadout.armor.filter(x => x).map(a => quick_mm_ref(EntryType.PILOT_ARMOR, a!.id));
    let weapon_refs = [...data.loadout.weapons, ...data.loadout.extendedWeapons].filter(x => x).map(a => quick_mm_ref(EntryType.PILOT_WEAPON, a!.id));
    let gear_refs = [...data.loadout.gear, ...data.loadout.extendedGear].filter(x => x).map(a => quick_mm_ref(EntryType.PILOT_GEAR, a!.id));
    await covetous.resolve_many(ctx, armor_refs);
    await covetous.resolve_many(ctx, weapon_refs);
    await covetous.resolve_many(ctx, gear_refs);

    // Do loadout stuff
    pilot.ActiveMech = await pilot_inv.get_cat(EntryType.MECH).lookup_mmid(ctx, data.active_mech) // Do an actor lookup. Note that we MUST do this AFTER syncing mechs
    pilot.Loadout = await PilotLoadout.unpack(data.loadout, pilot_inv, ctx); // Using reg stack here guarantees we'll grab stuff if we don't have it

    // We writeback. We should still be in a stable state though
    await pilot.writeback();
}
