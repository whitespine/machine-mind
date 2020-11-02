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
    Counter
} from "@/class";
import * as gistApi from "@/io/apis/gist";
import { IActionData, IMechState, IOrganizationData, IRankedData, IPilotLoadoutData, PackedReserveData, PackedMechData, PackedCounterSaveData, PackedCounterData } from "@/interface";
import { store } from "@/hooks";
import { ActiveState } from "../mech/ActiveState";
import { EntryType, RegEntry, RegRef, RegSer } from '@/registry';
import { Quirk } from './Quirk';
import { RegCounterData } from '../Counter';
import { Bonus } from '../Bonus';
import { nanoid } from 'nanoid';

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
    mechSkills: [number, number, number, number],
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
    loadout: IPilotLoadoutData;
    active_mech: string;
    brews: string[];
}


// This just gets converted into owned items
export interface RegPilotData extends BothPilotData {
    active_mech: string | null;

    // Since pilots are actors we don't need to cascade item ownership - just actor ownership
    mechs: RegRef<EntryType.MECH>[];
    skills: RegRef<EntryType.SKILL>[];
    talents: RegRef<EntryType.TALENT>[];
    custom_counters: RegCounterData[];
    // loadout --- hmmmmmm
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
    State!: ActiveState;

    CCVersion!: string;


    // TODO: Create a more formalized method of tracking brew ids or something. Right now we just drop it when parsing, but it should really be an additional value on regentry creation
    public get Brews(): string[] {
        return [];
    }

  // Just a simple check of if this pilot has a given thing. Largely deprecated but idk kinda still might be useful so I'm not deleting it
  /*
public has(
        feature: License | CoreBonus | Skill | CustomSkill | Talent | Reserve,
        rank?: number
    ): boolean {
          if (
            feature instanceof Skill ||
            feature instanceof Talent ||
            feature instanceof CustomSkill
        ) {
            let pilot_rank = this.rank(feature);
            return pilot_rank >= (rank || 1);
        } else if (feature instanceof CoreBonus) {
            return this.CoreBonuses.some(x => x.ID === feature.ID);
        } else if (feature instanceof License) {
            const license = this.Licenses.find(x => x.License.Name === feature.Name);
            return !!(license && license.Rank >= (rank || 0));
        } else if (feature instanceof Reserve) {
            const e = this.Reserves.find(
                x => x.ID === `reserve_${feature.ID}` || x.Name === feature.Name
            );
            return !!(e && !e.Used);
        } else {
            return false;
        }
    }
    */

  // -- Attributes --------------------------------------------------------------------------------
  public RenewID(): void {
    this.CloudID = ''
  }

  // public get Power(): number {
    // return (this.Level + 1) * 100
  // }


  public get HasIdent(): boolean {
    return !!(this.Name && this.Callsign)
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
    return this.CloudOwnerID === store.getters.getUserProfile.ID
  }

  public async CloudSave(): Promise<any> {
    if (!this.CloudOwnerID) {
      this.CloudOwnerID = store.getters.getUserProfile.ID
    }
    if (!this.CloudID) {
      return gistApi.newPilot(this).then((response: any) => {
        this.setCloudInfo(response.id)
      })
    } else {
      return gistApi.savePilot(this).then((response: any) => {
        this.setCloudInfo(response.id)
      })
    }
  }

  public async CloudLoad(): Promise<any> {
    if (!this.CloudID) return Promise.reject('No Cloud ID')
    return gistApi.loadPilot(this.CloudID).then(async (gist: any) => {
        // TODO
        console.error("not re-implemented yet");
        // await this.load(Pilot.unpack_as_reg(gist));
        this.LastCloudUpdate = new Date().toString()
    })
  }

  public CloudCopy(): Promise<any> {
    this.CloudID = ''
    this.CloudOwnerID = ''
    return this.CloudSave()
  }

  public setCloudInfo(id: string): void {
    this.CloudID = id
    this.CloudOwnerID = store.getters.getUserProfile.ID
    this.LastCloudUpdate = new Date().toString()
  }

  // -- Stats -------------------------------------------------------------------------------------
  public get Grit(): number {
    return Math.ceil(this.Level / 2)
  }

  public get MaxHP(): number {
    let health = Rules.BasePilotHP + this.Grit
    health += Bonus.SumVal(this, this.UnmountedBonuses, "pilot_hp");
    return health;
  }

  public Heal(): void {
    this.CurrentHP = this.MaxHP
  }

  public get Armor(): number {
    let armor = 0
    armor += Bonus.SumVal(this, this.UnmountedBonuses, "pilot_armor");
    return armor
  }

  public get Speed(): number {
    let speed = Rules.BasePilotSpeed
    speed += Bonus.SumVal(this, this.UnmountedBonuses, "pilot_speed");
    return speed
  }

  public get Evasion(): number {
    let evasion = Rules.BasePilotEvasion
    evasion += Bonus.SumVal(this, this.UnmountedBonuses, "pilot_evasion");
    return evasion
  }

  public get EDefense(): number {
    let edef = Rules.BasePilotEdef
    edef += Bonus.SumVal(this, this.UnmountedBonuses, "pilot_edef");
    return edef
  }

  //TODO: collect passives, eg:
  public get LimitedBonus(): number {
    let bonus = Math.floor(this.MechSkills.Eng / 2)
    if (this._core_bonuses.find(x => x.ID === 'cb_integrated_ammo_feeds')) {
      bonus += 2
    }
    return bonus
  }

  public get AICapacity(): number {
    return this.has('corebonus', 'cb_the_lesson_of_shaping') ? 2 : 1
  }

  // -- Skills ------------------------------------------------------------------------------------
  public get CurrentSkillPoints(): number {
    return this.Skills.reduce((sum, skill) => sum + skill.Rank, 0)
  }

  public get MaxSkillPoints(): number {
    const bonus = this.Reserves.filter(x => x.ID === 'reserve_skill').length
    return Rules.MinimumPilotSkills + this.Level + bonus
  }

  public get IsMissingSkills(): boolean {
    return this.CurrentSkillPoints < this.MaxSkillPoints
  }

  public get TooManySkills(): boolean {
    return this.CurrentSkillPoints > this.MaxSkillPoints
  }

  public get HasFullSkills(): boolean {
    return this.CurrentSkillPoints === this.MaxSkillPoints
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
      console.error(`Skill Trigger "${skill.Name}" does not exist on Pilot ${this._callsign}`)
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

  public ClearSkills(): void {
    for (let i = this._skills.length - 1; i >= 0; i--) {
      while (this._skills[i]) {
        this.RemoveSkill(this._skills[i].Skill)
      }
    }
  }

  // -- Talents -----------------------------------------------------------------------------------
  public get CurrentTalentPoints(): number {
    return this.Talents.reduce((sum, talent) => sum + talent.CurrentRank, 0)
  }

  public get MaxTalentPoints(): number {
    const bonus = this.Reserves.filter(x => x.ID === 'reserve_talent').length
    return Rules.MinimumPilotTalents + this.Level + bonus
  }

  public get IsMissingTalents(): boolean {
    return this.CurrentTalentPoints < this.MaxTalentPoints
  }

  public get TooManyTalents(): boolean {
    return this.CurrentTalentPoints > this.MaxTalentPoints
  }

  public get HasFullTalents(): boolean {
    return this.CurrentTalentPoints === this.MaxTalentPoints
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
      console.error(`Talent "${talent.Name}" does not exist on Pilot ${this._callsign}`)
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

  public ClearTalents(): void {
    for (let i = this._talents.length - 1; i >= 0; i--) {
      while (this._talents[i]) {
        this.RemoveTalent(this._talents[i].Talent)
      }
    }
  }


  // -- Core Bonuses ------------------------------------------------------------------------------
  public get CoreBonuses(): CoreBonus[] {
    return this._core_bonuses
  }

  public set CoreBonuses(coreBonuses: CoreBonus[]) {
    this._core_bonuses = coreBonuses
    this.save()
  }

  public get CurrentCBPoints(): number {
    return this._core_bonuses.length
  }

  public get MaxCBPoints(): number {
    const bonus = this.Reserves.filter(x => x.ID === 'reserve_corebonus').length
    return Math.floor(this._level / 3) + bonus
  }

  public get IsMissingCBs(): boolean {
    return this.CurrentCBPoints < this.MaxCBPoints
  }

  public get TooManyCBs(): boolean {
    return this.CurrentCBPoints > this.MaxCBPoints
  }

  public get HasCBs(): boolean {
    return this.CurrentCBPoints === this.MaxCBPoints
  }

  public AddCoreBonus(coreBonus: CoreBonus): void {
    this._core_bonuses.push(coreBonus)
    this.save()
  }

  public RemoveCoreBonus(coreBonus: CoreBonus): void {
    const index = this._core_bonuses.findIndex(x => _.isEqual(coreBonus, x))
    if (index === -1) {
      console.error(`CORE Bonus "${coreBonus.Name}" does not exist on Pilot ${this._callsign}`)
    } else {
      this._core_bonuses.splice(index, 1)
      this.removeCoreBonuses(coreBonus)
    }
    this.save()
  }

  public ClearCoreBonuses(): void {
    for (let i = this._core_bonuses.length - 1; i >= 0; i--) {
      this.RemoveCoreBonus(this._core_bonuses[i])
    }
  }

  private removeCoreBonuses(coreBonus: CoreBonus): void {
    this._mechs.forEach(mech => {
      mech.Loadouts.forEach(loadout => {
        if (coreBonus.ID === 'cb_mount_retrofitting') loadout.RemoveRetrofitting()
        if (coreBonus.ID === 'cb_improved_armament') loadout.ImprovedArmamentMount.Clear()
        if (coreBonus.ID === 'cb_integrated_weapon') loadout.IntegratedWeaponMount.Clear()
        loadout.AllEquippableMounts(true).forEach(mount => {
          mount.RemoveCoreBonus(coreBonus)
        })
      })
    })
  }

  // -- Licenses ----------------------------------------------------------------------------------
  public get Licenses(): PilotLicense[] {
    return this._licenses
  }

  public set Licenses(licenses: PilotLicense[]) {
    this._licenses = licenses
    this.save()
  }

  public LicenseLevel(manufacturerID: string): number {
    return this.Licenses.filter(
      x => x.License.Source.toLowerCase() === manufacturerID.toLowerCase()
    ).reduce((a, b) => +a + +b.Rank, 0)
  }

  public get CurrentLicensePoints(): number {
    return this._licenses.reduce((sum, license) => sum + license.Rank, 0)
  }

  public get MaxLicensePoints(): number {
    const bonus = this.Reserves.filter(x => x.ID === 'reserve_license').length
    return this._level + bonus
  }

  public get IsMissingLicenses(): boolean {
    return this.CurrentLicensePoints < this.MaxLicensePoints
  }

  public get TooManyLicenses(): boolean {
    return this.CurrentLicensePoints > this.MaxLicensePoints
  }

  public get HasLicenses(): boolean {
    return this.CurrentLicensePoints === this.MaxLicensePoints
  }

  public getLicenseRank(_name: string): number {
    const index = this._licenses.findIndex(x => x.License.Name === _name)
    return index > -1 ? this._licenses[index].Rank : 0
  }

  public AddLicense(license: License): void {
    const index = this._licenses.findIndex(x => _.isEqual(x.License, license))
    if (index === -1) {
      this._licenses.push(new PilotLicense(license, 1))
    } else {
      this._licenses[index].Increment()
    }
    this.save()
  }

  public RemoveLicense(license: License): void {
    const index = this._licenses.findIndex(x => _.isEqual(x.License, license))
    if (index === -1) {
      console.error(`License "${license.ToString()}" does not exist on Pilot ${this._callsign}`)
    } else {
      if (this._licenses[index].Rank > 1) {
        this._licenses[index].Decrement()
      } else {
        this._licenses.splice(index, 1)
      }
    }
    this.save()
  }

  public ClearLicenses(): void {
    for (let i = this._licenses.length - 1; i >= 0; i--) {
      while (this._licenses[i]) {
        this.RemoveLicense(this._licenses[i].License)
      }
    }
  }

  // -- Mech Skills -------------------------------------------------------------------------------
  public get MechSkills(): MechSkills {
    return this._mechSkills
  }

  public set MechSkills(mechskills: MechSkills) {
    this._mechSkills = mechskills
    this.save()
  }

  public resetHASE(): void {
    this._mechSkills.Reset()
  }

  public get CurrentHASEPoints(): number {
    return this._mechSkills.Sum
  }

  public get MaxHASEPoints(): number {
    const bonus = this.Reserves.filter(x => x.ID === 'reserve_mechskill').length
    return Rules.MinimumMechSkills + this._level + bonus
  }

  public get IsMissingHASE(): boolean {
    return this.CurrentHASEPoints < this.MaxHASEPoints
  }

  public get TooManyHASE(): boolean {
    return this.CurrentHASEPoints > this.MaxHASEPoints
  }

  public get HasFullHASE(): boolean {
    return this.CurrentHASEPoints === this.MaxHASEPoints
  }

  // -- Downtime Reserves -------------------------------------------------------------------------
  public get Reserves(): Reserve[] {
    return this._reserves
  }

  public set Reserves(reserves: Reserve[]) {
    this._reserves = reserves
    this.save()
  }

  public RemoveReserve(index: number): void {
    this._reserves.splice(index, 1)
    this.save()
  }

  public get Organizations(): Organization[] {
    return this._orgs
  }

  public set Organizations(orgs: Organization[]) {
    this._orgs = orgs
    this.save()
  }

  public RemoveOrganization(index: number): void {
    this._orgs.splice(index, 1)
    this.save()
  }

  // -- Loadouts ----------------------------------------------------------------------------------
  public get Loadout(): PilotLoadout {
    return this._loadout
  }

  public set Loadout(l: PilotLoadout) {
    this._loadout = l
    this.save()
  }

  // -- Mechs -----------------------------------------------------------------------------------
  public get Mechs(): Mech[] {
    return this._mechs
  }

  public AddMech(mech: Mech): void {
    this._mechs.push(mech)
    this.save()
  }

  public RemoveMech(mech: Mech): void {
    const index = this._mechs.findIndex(x => _.isEqual(x, mech))
    if (index === -1) {
      console.error(`Loadout "${mech.Name}" does not exist on Pilot ${this._callsign}`)
    } else {
      this._mechs.splice(index, 1)
    }
    this.save()
  }

  public CloneMech(mech: Mech): void {
    const mechData = Mech.Serialize(mech)
    const clone = Mech.Deserialize(mechData, this)
    clone.RenewID()
    clone.Name += '*'
    clone.IsActive = false
    this._mechs.push(clone)
    this.save()
  }

  public get ActiveMech(): Mech | null {
    if (!this._active_mech) {
      if (!this._mechs.length) return null
      this.ActiveMech = this._mechs[0]
    }
    return this._mechs.find(x => x.ID === this._active_mech) || null
  }

  public set ActiveMech(mech: Mech | null) {
    this._mechs.forEach(m => {
      m.IsActive = false
    })

    if (!mech) {
      this.save()
      return
    }

    mech.IsActive = true
    this._active_mech = mech.ID
    this.save()
  }

  public get Mounted(): boolean {
    if (!this.ActiveMech) return false
    if (this.ActiveMech.Destroyed || this.ActiveMech.ReactorDestroyed || this.ActiveMech.Ejected)
      return false
    return this._mounted
  }

  public set Mounted(val: boolean) {
    if (val) this.ActiveMech.Ejected = false
    this._mounted = val
    this.save()
  }

  // -- COUNTERS ----------------------------------------------------------------------------------

  private _counterSaveData = []
  public get CounterSaveData(): ICounterSaveData[] {
    return this._counterSaveData
  }
  public saveCounter(inputData: ICounterSaveData): void {
    const index = this._counterSaveData.findIndex(datum => datum.id === inputData.id)
    if (index < 0) {
      this._counterSaveData = [...this._counterSaveData, inputData]
    } else {
      this._counterSaveData[index] = inputData
      this._counterSaveData = [...this._counterSaveData]
    }
    this.save()
  }

  public createCustomCounter(name: string): void {
    const counter = {
      name,
      id: nanoid(),
      custom: true,
    }
    this._customCounters = [...this._customCounters, counter]
    this.save()
  }

  public deleteCustomCounter(id: string): void {
    const index = this._customCounters.findIndex(c => c.custom && c.id === id)
    if (index > -1) {
      this._customCounters.splice(index, 1)
      this._customCounters = [...this._customCounters]
    }
    this.save()
  }

  // Grabs counters from the pilot, their gear, their active mech, etc etc
  public get Counters(): Counter[] {
    return [
      ...this.Talents.flatMap(t => t.Counters),
      ...this.CoreBonuses.flatMap(cb => cb.Counters),
      ...(this.ActiveMech?.Counters || []),
      ...this.CustomCounters,
    ]
      .filter(x => x)
  }

  // Lists all of the bonuses this unmounted pilot is receiving
  public get UnmountedBonuses(): Bonus[] {
      // TODO
    return [];
  }
}