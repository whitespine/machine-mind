import {
    Rules,
    Reserve,
    MechSkills,
    PilotLicense,
    PilotLoadout,
    PilotSkill,
    PilotTalent,
    Skill,
    License,
    Talent,
    CoreBonus,
    Mech,
    Organization,
    ContentPack,
    Faction,
    Counter,
} from "@/class";
import * as gistApi from "@/io/apis/gist";
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
} from "@/interface";
import { store } from "@/hooks";
import { EntryType, RegEntry, RegRef, RegSer } from "@/registry";
import { nanoid } from "nanoid";
import { RegPilotLoadoutData } from './PilotLoadout';
import { Bonus } from '../Bonus';
import { bound_int } from '@/funcs';

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
    factionID: string;
    text_appearance: string;
    notes: string;
    history: string;
    portrait: string;
    cloud_portrait: string;
    quirk: string;
    current_hp: number;
    background: string;
    mechSkills: [number, number, number, number];
    core_bonuses: string[];
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
}

// This just gets converted into owned items
export interface RegPilotData extends Required<BothPilotData> {
    active_mech: string | null;

    // Since pilots are actors we don't need to cascade item ownership - just actor ownership
    mechs: RegRef<EntryType.MECH>[];
    skills: RegRef<EntryType.SKILL>[];
    talents: RegRef<EntryType.TALENT>[];
    custom_counters: RegCounterData[];
    loadout: RegPilotLoadoutData;

    // We don't really track active state much here. We do at least track mounted state
    mounted: boolean;
}

export class Pilot extends RegEntry<EntryType.PILOT, RegPilotData> {
    // Identity
    Name!: string;
    Callsign!: string;
    PlayerName!: string;
    Background!: string;
    Notes!: string;
    History!: string;
    Portrait!: string;
    TextAppearance!: string;

    // Quirk!: string; -- we remove this, as we now store quirks as items
    Quirk!: Quirk;

    Group!: string;
    SortIndex!: number;

    Campaign!: string;
    FactionID!: string;

    CloudID!: string;
    CloudOwnerID!: string;
    CloudPortrait!: string;
    LastCloudUpdate!: string;

    Level!: number;
    Status!: string;
    CurrentHP!: number;
    Loadout!: PilotLoadout;
    ActiveMech!: Mech | null;

    CoreBonuses!: CoreBonus[];
    Licenses!: PilotLicense[];
    MechSkills!: MechSkills;
    Reserves!: Reserve[];
    Skills!: PilotSkill[];
    Talents!: Talent[];
    Orgs!: Organization[];
    Mechs!: Mech[];
    CustomCounters!: Counter[];
    // State!: ActiveState;
    Mounted!: boolean;


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
        return this.CloudOwnerID === store.getters.getUserProfile.ID;
    }

    public async CloudSave(): Promise<any> {
        if (!this.CloudOwnerID) {
            this.CloudOwnerID = store.getters.getUserProfile.ID;
        }
        if (!this.CloudID) {
            return gistApi.newPilot(this).then((response: any) => {
                this.setCloudInfo(response.id);
            });
        } else {
            return gistApi.savePilot(this).then((response: any) => {
                this.setCloudInfo(response.id);
            });
        }
    }

    public async CloudLoad(): Promise<any> {
        if (!this.CloudID) return Promise.reject("No Cloud ID");
        return gistApi.loadPilot(this.CloudID).then(async (gist: any) => {
            // TODO
            console.error("not re-implemented yet");
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
        this.CloudOwnerID = store.getters.getUserProfile.ID;
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
        return this.Skills.reduce((sum, skill) => sum + skill.Rank, 0);
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
            x => x.License.Source.toLowerCase() === manufacturerID.toLowerCase()
        ).reduce((a, b) => +a + +b.Rank, 0);
    }

    public get CurrentLicensePoints(): number {
        return this.Licenses.reduce((sum, license) => sum + license.Rank, 0);
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

    public getLicenseRank(_name: string): number {
        const index = this.Licenses.findIndex(x => x.License.Name === _name);
        return index > -1 ? this.Licenses[index].Rank : 0;
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
            ...(this.ActiveMech?.Counters || []),
            ...this.CustomCounters,
        ].filter(x => x);
    }

    // Lists all of the bonuses this unmounted pilot is receiving
    public get PilotBonuses(): Bonus[] {
        // TODO
        return [];
    }


    // Sum our pilot bonuses for the specified id, return the number
    private sum_bonuses(id: string): number {
        return Bonus.SumPilotBonuses(this, this.PilotBonuses, id);
    }
}
