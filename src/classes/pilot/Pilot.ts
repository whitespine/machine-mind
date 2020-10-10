import uuid from "uuid/v4";
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
import { ICounterData, IActionData, IMechData, IMechState, IOrganizationData, IReserveData, IRankedData, ICounterSaveData, IPilotLoadoutData } from "@/interface";
import { store } from "@/hooks";
import { ActiveState } from "../mech/ActiveState";
import { MixLinks, MixBuilder, RWMix, ident, ser_many } from '@/mixmeta';
import { CreateMechSkills } from './MechSkills';
import { VRegistryItem } from '../registry';

// Note: we'll need to mogrify our pilot data a little bit to coerce it to this form

export interface PackedPilotData {
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
    licenses: IRankedData[];
    skills: IRankedData[];
    talents: IRankedData[];
    core_bonuses: string[];
    reserves: IReserveData[];
    orgs: IOrganizationData[];
    loadout: IPilotLoadoutData;
    mechs: IMechData[];
    active_mech: string;
    cc_ver: string;
    counter_data: ICounterSaveData[];
    custom_counters: object[];
    brews: string[];
    state?: IMechState;
}
export interface Pilot extends MixLinks<IPilotData>, VRegistryItem {
    // Identity
    Name: string;
    Callsign: string;
    PlayerName: string;
    Background: string;
    Notes: string;
    History: string;
    Portrait: string;
    TextAppearance: string;

    // Quirk: string; -- we remove this, as we now store quirks as items
    Quirk: 

    Group: string;
    SortIndex: number;

    Campaign: string;
    FactionID: string;

    CloudID: string;
    CloudOwnerID: string;
    CloudPortrait: string;
    LastCloudUpdate: string;

    Level: number;
    Status: string;
    CurrentHP: number;
    Loadout: PilotLoadout;
    ActiveMech: string;

    CoreBonuses: CoreBonus[];
    Licenses: PilotLicense[];
    MechSkills: MechSkills;
    Reserves: Reserve[];
    Skills: PilotSkill[];
    Talents: PilotTalent[];
    Orgs: Organization[];
    Mechs: Mech[];
    CustomCounters: Counter[];
    CounterData: ICounterSaveData[]; // When generating counters we should default to pulling data from here. TODO: do this lol xd lmaoooo he said the thing
    State: ActiveState;

    Brews: string[];
    CCVersion: string;

    // Methods
    // Updates brew field to reflect all attached content
    SetBrewData(this: Pilot): void;

    // Check if the lancer has any of the following "possessions"
    has(feature: License | CoreBonus | Skill | CustomSkill | Talent | Reserve, rank?: number): boolean;

    // Get the rank of the specified skill/talent. Returns 0 if none
    rank(this: Pilot, feature: Skill | CustomSkill | Talent): number;

}

export function CreatePilot(data: IPilotData): Pilot {
    let b = new MixBuilder<Pilot, IPilotData>({
        has, rank, SetBrewData
    });
    b.with(new RWMix("ID", "id", ident, ident));
    b.with(new RWMix("Campaign", "campaign", ident, ident));
    b.with(new RWMix("Group", "group", ident, ident));
    b.with(new RWMix("SortIndex", "sort_index", ident, ident));
    b.with(new RWMix("CloudID", "cloudID", ident, ident));
    b.with(new RWMix("CloudOwnerID", "cloudOwnerID", ident, ident));
    b.with(new RWMix("LastCloudUpdate", "lastCloudUpdate", ident, ident));
    b.with(new RWMix("Level", "level", ident, ident));
    b.with(new RWMix("Callsign", "callsign", ident, ident));
    b.with(new RWMix("Name", "name", ident, ident));
    b.with(new RWMix("PlayerName", "player_name", ident, ident));
    b.with(new RWMix("Status", "status", ident, ident));
    b.with(new RWMix("FactionID", "factionID", ident, ident));
    b.with(new RWMix("TextAppearance", "text_appearance", ident, ident));
    b.with(new RWMix("Notes", "notes", ident, ident));
    b.with(new RWMix("History", "history", ident, ident));
    b.with(new RWMix("Portrait", "portrait", ident, ident));
    b.with(new RWMix("CloudPortrait", "cloud_portrait", ident, ident));
    b.with(new RWMix("Quirk", "quirk", ident, ident));
    b.with(new RWMix("CurrentHP", "current_hp", ident, ident));
    b.with(new RWMix("Background", "background", ident, ident));
    b.with(new RWMix("MechSkills", "mechSkills",0,0,0]), CreateMechSkills, (x) => x.Serialize()));
    b.with(new RWMix("Licenses", "licenses", x?.map(CreateLicense) || [], (x) => x.map(y => y.Serialize()));
    b.with(new RWMix("Skills", "skills", (x) => x?.map(CreateSkill) || [], ser_many);
    b.with(new RWMix("Talents", "talents", (x) => (x || []).map(CreateTalent), ser_many);
    b.with(new RWMix("CoreBonuses", "core_bonuses", ident, ident));
    b.with(new RWMix("Reserves", "reserves", ident, ident));
    b.with(new RWMix("Orgs", "orgs", ident, ident));
    b.with(new RWMix("Loadout", "loadout", ident, ident));
    b.with(new RWMix("Mechs", "mechs", ident, ident));
    b.with(new RWMix("ActiveMech", "active_mech", ident, ident));
    b.with(new RWMix("CCVersion", "cc_ver", ident, ident));
    b.with(new RWMix("CounterData", "counter_data", ident, ident));
    b.with(new RWMix("CustomCounters", "custom_counters", ident, ident));
    b.with(new RWMix("Brews", "brews", ident, ident));
    b.with(new RWMix("State", "state", ident, ident));

    // Finalize and check.
    let r = b.finalize(data);
    return r;
}


// Method definitions
function SetBrewData(this: Pilot): void {
    const packs = store.compendium.ContentPacks;

    function collectBrewGroup(items: VCompendiumItem[]): string[] {
      return items
        .filter(x => x != null)
        .map(i => i.Brew)
        .filter(x => x.toLowerCase() !== 'core')
    }

    let brews = collectBrewGroup(this.Loadout.Items)
    this.Mechs.forEach(m => {
      brews = _.union(brews, collectBrewGroup([m.Frame]))
      m.Loadouts.forEach(ml => {
        brews = _.union(brews, collectBrewGroup(ml.Weapons))
        brews = _.union(brews, collectBrewGroup(ml.Systems))
      })
    })
    brews = brews.map(x => packs.find(y => y.ID === x)).map(z => `${z.Name} @ ${z.Version}`)
    this.Brews = brews
  }

    function has(
        this: Pilot,
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

    // Get the rank of the specified skill/talent. Returns 0 if none
    function rank(this: Pilot, feature: Skill | CustomSkill | Talent): number {
        if (feature instanceof Skill) {
            let valid = [feature.ID, feature.Name];
            let found = this._skills.find(
                x => valid.includes(x.Skill.Name) || valid.includes(x.Skill.ID)
            );
            return found?.Rank || 0;
        } else {
            let found = this._talents.find(x => x.Talent.ID === feature.ID);
            return found?.Rank || 0;
        }
    }

     function ApplyLevel(update: IPilotData): void {
        this.setPilotData(update);
        this.save();
    }

     function getPower(this: Pilot): number {
        return (this.Level + 1) * 100;
    }

     function getHasIdent(this: Pilot): boolean {
        return !!(this.Name && this.Callsign);
    }

     function getIsUserOwned(this: Pilot): boolean {
        return this.CloudOwnerID === store.user.ID;
    }


     async function CloudSave(this: Pilot): Promise<any> {
        this.SetBrewData();
        if (!this.CloudOwnerID) {
            this.CloudOwnerID = store.user.ID;
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

     async function CloudLoad(this: Pilot): Promise<any> {
        if (!this.CloudID) return Promise.reject("No Cloud ID");
        return gistApi.loadPilot(this.CloudID).then((gist: any) => {
            this.setPilotData(gist);
            this.LastCloudUpdate = new Date().toString();
        });
    }

     function CloudCopy(this: Pilot): Promise<any> {
        this.CloudID = "";
        this.CloudOwnerID = "";
        return this.CloudSave();
    }

     function setCloudInfo(id: string): void {
        this.CloudID = id;
        this.CloudOwnerID = store.user.ID;
        this.LastCloudUpdate = new Date().toString();
    }

    // -- Stats -------------------------------------------------------------------------------------
     function getGrit(this: Pilot): number {
        return Math.ceil(this._level / 2);
    }

     function getMaxHP(this: Pilot): number {
        let health = Rules.BasePilotHP + this.Grit;
        this.Loadout.Armor.forEach(x => {
            if (x) health += x.HPBonus;
        });
        return health;
    }

     function getCurrentHP(this: Pilot): number {
        return this._current_hp;
    }

     function setCurrentHP(hp: number) {
        if (hp > this.MaxHP) this._current_hp = this.MaxHP;
        else if (hp < 0) this._current_hp = 0;
        else this._current_hp = hp;

        if (this._current_hp === 0) {
            this.Status = "KIA";
        }

        this.save();
    }

     function Heal(this: Pilot): void {
        this.CurrentHP = this.MaxHP;
    }

     function getArmor(this: Pilot): number {
        let armor = 0;
        this.Loadout.Armor.forEach(x => {
            if (x) armor += x.Armor;
        });
        return armor;
    }

     function getSpeed(this: Pilot): number {
        let speed = Rules.BasePilotSpeed;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.Speed) speed = x.Speed;
            speed += x.SpeedBonus;
        });
        return speed;
    }

     function getEvasion(this: Pilot): number {
        let evasion = Rules.BasePilotEvasion;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.Evasion) evasion = x.Evasion;
            evasion += x.EvasionBonus;
        });
        return evasion;
    }

     function getEDefense(this: Pilot): number {
        let edef = Rules.BasePilotEdef;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.EDefense) edef = x.EDefense;
            edef += x.EDefenseBonus;
        });
        return edef;
    }

    //TODO: collect passives, eg:
     function getLimitedBonus(this: Pilot): number {
        let bonus = Math.floor(this.MechSkills.Eng / 2);
        if (this._core_bonuses.find(x => x.ID === "cb_integrated_ammo_feeds")) {
            bonus += 2;
        }
        return bonus;
    }

     function getAICapacity(this: Pilot): number {
        let tlos = store.compendium.getReferenceByID("CoreBonuses", "cb_the_lesson_of_shaping");
        return this.has(tlos) ? 2 : 1;
    }

    // -- Skills ------------------------------------------------------------------------------------
     function getSkills(this: Pilot): PilotSkill[] {
        return this._skills;
    }

     function setSkills(skills: PilotSkill[]) {
        this._skills = skills;
        this.save();
    }

     function getCurrentSkillPoints(this: Pilot): number {
        return this._skills.reduce((sum, skill) => sum + skill.Rank, 0);
    }

     function getMaxSkillPoints(this: Pilot): number {
        const bonus = this.Reserves.filter(x => x.ID === "reserve_skill").length;
        return Rules.MinimumPilotSkills + this._level + bonus;
    }

     function getIsMissingSkills(this: Pilot): boolean {
        return this.CurrentSkillPoints < this.MaxSkillPoints;
    }

     function getTooManySkills(this: Pilot): boolean {
        return this.CurrentSkillPoints > this.MaxSkillPoints;
    }

     function getHasFullSkills(this: Pilot): boolean {
        return this.CurrentSkillPoints === this.MaxSkillPoints;
    }

     function CanAddSkill(skill: Skill | CustomSkill): boolean {
        if (this._level === 0) {
            return this._skills.length < Rules.MinimumPilotSkills && !this.has(skill);
        } else {
            const underLimit = this.CurrentSkillPoints < this.MaxSkillPoints;
            if (!this.has(skill) && underLimit) return true;
            const pSkill = this._skills.find(x => x.Skill.ID === skill.ID);
            if (underLimit && pSkill && pSkill.Rank < Rules.MaxTriggerRank) {
                return true;
            }
            return false;
        }
    }

     function AddSkill(skill: Skill | CustomSkill): void {
        const index = this._skills.findIndex(x => _.isEqual(x.Skill, skill));
        if (index === -1) {
            this._skills.push(new PilotSkill(skill));
        } else {
            this._skills[index].Increment();
        }
        this.save();
    }

     function AddCustomSkill(cs: { skill: string; description: string; detail: string }): void {
        this.AddSkill(new CustomSkill(cs.skill, cs.description, cs.detail));
    }

     function CanRemoveSkill(skill: Skill | CustomSkill): boolean {
        return this.has(skill);
    }

     function RemoveSkill(skill: Skill | CustomSkill): void {
        const index = this._skills.findIndex(x => x.Skill.ID === skill.ID);
        if (index === -1) {
            console.error(
                `Skill Trigger "${skill.Name}" does not exist on Pilot ${this._callsign}`
            );
        } else {
            if (this._skills[index].Rank > 1) {
                this._skills[index].Decrement();
            } else {
                this._skills.splice(index, 1);
            }
        }
        this.save();
    }

     function ClearSkills(this: Pilot): void {
        for (let i = this._skills.length - 1; i >= 0; i--) {
            while (this._skills[i]) {
                this.RemoveSkill(this._skills[i].Skill);
            }
        }
    }

    // -- Talents -----------------------------------------------------------------------------------
     function getTalents(this: Pilot): PilotTalent[] {
        return this._talents;
    }

     function setTalents(talents: PilotTalent[]) {
        this._talents = talents;
        this.save();
    }

     function getCurrentTalentPoints(this: Pilot): number {
        return this._talents.reduce((sum, talent) => sum + talent.Rank, 0);
    }

     function getMaxTalentPoints(this: Pilot): number {
        return Rules.MinimumPilotTalents + this._level;
    }

     function getIsMissingTalents(this: Pilot): boolean {
        return this.CurrentTalentPoints < this.MaxTalentPoints;
    }

     function getTooManyTalents(this: Pilot): boolean {
        return this.CurrentTalentPoints > this.MaxTalentPoints;
    }

     function getHasFullTalents(this: Pilot): boolean {
        return this.CurrentTalentPoints === this.MaxTalentPoints;
    }

     function getTalentRank(id: string): number {
        const index = this._talents.findIndex(x => x.Talent.ID === id);
        return index > -1 ? this._talents[index].Rank : 0;
    }

     function AddTalent(talent: Talent): void {
        const index = this._talents.findIndex(x => _.isEqual(x.Talent, talent));
        if (index === -1) {
            this._talents.push(new PilotTalent(talent));
        } else {
            this._talents[index].Increment();
        }
        this.talentSort();
        this.updateIntegratedTalents();
        this.save();
    }

     function RemoveTalent(talent: Talent): void {
        const index = this._talents.findIndex(x => _.isEqual(x.Talent, talent));
        if (index === -1) {
            console.error(`Talent "${talent.Name}" does not exist on Pilot ${this._callsign}`);
        } else {
            if (this._talents[index].Rank > 1) {
                this._talents[index].Decrement();
            } else {
                this._talents.splice(index, 1);
            }
        }
        this.talentSort();
        this.updateIntegratedTalents();
        this.save();
    }

     function ClearTalents(this: Pilot): void {
        for (let i = this._talents.length - 1; i >= 0; i--) {
            while (this._talents[i]) {
                this.RemoveTalent(this._talents[i].Talent);
            }
        }
    }

    function talentSort(this: Pilot): void {
        this._talents = this._talents.sort(function(a, b) {
            return a.Rank === b.Rank ? 0 : a.Rank > b.Rank ? -1 : 1;
        });
    }

    function updateIntegratedTalents(this: Pilot): void {
        this._mechs.forEach(mech => {
            mech.UpdateLoadouts();
        });
    }

     function getTalentActions(this: Pilot): IAction[] {
        let talent_actions: IAction[] = [];
        for (let talent of this._talents) {
            for (let rank of talent.UnlockedRanks) {
                let as = rank.actions;
                if(as) talent_actions.push(...as);
            }
        }
        return talent_actions;
    }

    // -- Core Bonuses ------------------------------------------------------------------------------
     function getCoreBonuses(this: Pilot): CoreBonus[] {
        return this._core_bonuses;
    }

     function setCoreBonuses(coreBonuses: CoreBonus[]) {
        this._core_bonuses = coreBonuses;
        this.save();
    }

     function getCurrentCBPoints(this: Pilot): number {
        return this._core_bonuses.length;
    }

     function getMaxCBPoints(this: Pilot): number {
        return Math.floor(this._level / 3);
    }

     function getIsMissingCBs(this: Pilot): boolean {
        return this.CurrentCBPoints < this.MaxCBPoints;
    }

     function getTooManyCBs(this: Pilot): boolean {
        return this.CurrentCBPoints > this.MaxCBPoints;
    }

     function getHasCBs(this: Pilot): boolean {
        return this.CurrentCBPoints === this.MaxCBPoints;
    }

     function AddCoreBonus(coreBonus: CoreBonus): void {
        this._core_bonuses.push(coreBonus);
        this.save();
    }

     function RemoveCoreBonus(coreBonus: CoreBonus): void {
        const index = this._core_bonuses.findIndex(x => _.isEqual(coreBonus, x));
        if (index === -1) {
            console.error(
                `CORE Bonus "${coreBonus.Name}" does not exist on Pilot ${this._callsign}`
            );
        } else {
            this._core_bonuses.splice(index, 1);
            this.removeCoreBonuses(coreBonus);
        }
        this.save();
    }

     function ClearCoreBonuses(this: Pilot): void {
        for (let i = this._core_bonuses.length - 1; i >= 0; i--) {
            this.RemoveCoreBonus(this._core_bonuses[i]);
        }
    }

    function removeCoreBonuses(coreBonus: CoreBonus): void {
        this._mechs.forEach(mech => {
            mech.Loadouts.forEach(loadout => {
                if (coreBonus.ID === "cb_mount_retrofitting") loadout.RemoveRetrofitting();
                if (coreBonus.ID === "cb_improved_armament") loadout.ImprovedArmamentMount.Clear();
                if (coreBonus.ID === "cb_integrated_weapon") loadout.IntegratedWeaponMount.Clear();
                loadout.AllEquippableMounts(true).forEach(mount => {
                    mount.RemoveCoreBonus(coreBonus);
                });
            });
        });
    }

    // -- Licenses ----------------------------------------------------------------------------------
     function getLicenses(this: Pilot): PilotLicense[] {
        return this._licenses;
    }

     function setLicenses(licenses: PilotLicense[]) {
        this._licenses = licenses;
        this.save();
    }

     function LicenseLevel(manufacturerID: string): number {
        return this.Licenses.filter(
            x => x.License.Source.toLowerCase() === manufacturerID.toLowerCase()
        ).reduce((a, b) => +a + +b.Rank, 0);
    }

     function getCurrentLicensePoints(this: Pilot): number {
        return this._licenses.reduce((sum, license) => sum + license.Rank, 0);
    }

     function getMaxLicensePoints(this: Pilot): number {
        return this._level;
    }

     function getIsMissingLicenses(this: Pilot): boolean {
        return this.CurrentLicensePoints < this.MaxLicensePoints;
    }

     function getTooManyLicenses(this: Pilot): boolean {
        return this.CurrentLicensePoints > this.MaxLicensePoints;
    }

     function getHasLicenses(this: Pilot): boolean {
        return this.CurrentLicensePoints === this.MaxLicensePoints;
    }

     function getLicenseRank(_name: string): number {
        const index = this._licenses.findIndex(x => x.License.Name === _name);
        return index > -1 ? this._licenses[index].Rank : 0;
    }

     function AddLicense(license: License): void {
        const index = this._licenses.findIndex(x => _.isEqual(x.License, license));
        if (index === -1) {
            this._licenses.push(new PilotLicense(license, 1));
        } else {
            this._licenses[index].Increment();
        }
        this.save();
    }

     function RemoveLicense(license: License): void {
        const index = this._licenses.findIndex(x => _.isEqual(x.License, license));
        if (index === -1) {
            console.error(
                `License "${license.ToString()}" does not exist on Pilot ${this._callsign}`
            );
        } else {
            if (this._licenses[index].Rank > 1) {
                this._licenses[index].Decrement();
            } else {
                this._licenses.splice(index, 1);
            }
        }
        this.save();
    }

     function ClearLicenses(this: Pilot): void {
        for (let i = this._licenses.length - 1; i >= 0; i--) {
            while (this._licenses[i]) {
                this.RemoveLicense(this._licenses[i].License);
            }
        }
    }

    // -- Mech Skills -------------------------------------------------------------------------------
     function getMechSkills(this: Pilot): MechSkills {
        return this._mechSkills;
    }

     function setMechSkills(mechskills: MechSkills) {
        this._mechSkills = mechskills;
        this.save();
    }


    // -- Mechs -----------------------------------------------------------------------------------


    // -- COUNTERS ----------------------------------------------------------------------------------

     function getCounterSaveData(this: Pilot): ICounterSaveData[] {
        return this._counterSaveData;
    }
     function saveCounter(inputData: ICounterSaveData): void {
        const index = this._counterSaveData.findIndex(datum => datum.id === inputData.id);
        if (index < 0) {
            this._counterSaveData = [...this._counterSaveData, inputData];
        } else {
            this._counterSaveData[index] = inputData;
            this._counterSaveData = [...this._counterSaveData];
        }
        this.save();
    }

    private _customCounters: ICounterData[] = [];
     function getCustomCounterData(this: Pilot): ICounterData[] {
        return this._customCounters || [];
    }

     function createCustomCounter(name: string): void {
        const counter = {
            name,
            id: uuid(),
            custom: true,
        };
        this._customCounters = [...this._customCounters, counter];
        this.save();
    }

     function deleteCustomCounter(id: string): void {
        const index = this._customCounters.findIndex(c => c.custom && c.id === id);
        if (index > -1) {
            this._customCounters.splice(index, 1);
            this._customCounters = [...this._customCounters];
        }
        this.save();
    }

     function getCounterData(this: Pilot): ICounterData[] {
        return [
            this.Talents?.flatMap(pilotTalent =>
                pilotTalent.Talent.Counters.filter(x => !x.level || x.level <= pilotTalent.Rank)
            ),
            this.CoreBonuses?.flatMap(cb => cb.Counters),
            this.ActiveMech?.Frame.Counters,
            this.ActiveMech?.ActiveLoadout?.Systems.flatMap(system => system.Counters),
            this.ActiveMech?.ActiveLoadout?.Weapons.flatMap(weapon => [
                ...weapon.Counters,
                ...(weapon.Mod?.Counters || []),
            ]),
            this.ActiveMech?.Frame.CoreSystem.Integrated?.Counters,
            this.CustomCounterData,
        ]
            .flat()
            .filter(x => x) as ICounterData[];
    }
}


// Set the pilots brews based on which brews its frames, licenses, etc come from
 function SetBrewData(override?: string[]): void {
    if(override) {
        this.brews = override;

    }
    const packs = store.compendium.ContentPacks;

    function collectBrewGroup(items: CompendiumItem[]): string[] {
        return items
            .filter(x => x != null)
            .map(i => i.Brew)
            .filter(x => x.toLowerCase() !== "core");
    }

    let brews = collectBrewGroup(this._loadout.Items);
    this._mechs.forEach(m => {
        brews = _.union(brews, collectBrewGroup([m.Frame]));
        m.Loadouts.forEach(ml => {
            brews = _.union(brews, collectBrewGroup(ml.Weapons));
            brews = _.union(brews, collectBrewGroup(ml.Systems));
        });
    });
    brews = brews.map(x => packs.find(y => y.ID === x)).map(z => `${z?.Name} @ ${z?.Version}`);
    this._brews = brews;
}


 function resetHASE(pilot: Pilot): void {
    this._mechSkills.Reset();
}

 function CurrentHASEPoints(pilot: Pilot): number {
    return this._mechSkills.Sum;
}

 function MaxHASEPoints(pilot: Pilot): number {
    return Rules.MinimumMechSkills + this._level;
}

 function IsMissingHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints < this.MaxHASEPoints;
}

 function TooManyHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints > this.MaxHASEPoints;
}

 function HasFullHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints === this.MaxHASEPoints;
}

 function RemoveMech(mech: Mech): void {
        const index = this._mechs.findIndex(x => _.isEqual(x, mech));
        if (index === -1) {
            console.error(`Loadout "${mech.Name}" does not exist on Pilot ${this._callsign}`);
        } else {
            this._mechs.splice(index, 1);
        }
        this.save();
    }

     function CloneMech(mech: Mech): void {
        const mechData = Mech.Serialize(mech);
        const clone = Mech.Deserialize(mechData, this);
        clone.RenewID();
        clone.Name += "*";
        clone.IsActive = false;
        this._mechs.push(clone);
        this.save();
    }

    
    // Controls the active state. Due to volatility, you should always route methods through the State getter
     function setActiveMech(mech: Mech) {
        if(mech) {
            this._state = new ActiveState(this);
        } else {
            this._state = null;
        }
    }