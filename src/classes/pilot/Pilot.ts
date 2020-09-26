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
    CustomSkill,
    Organization,
    ContentPack,
    Faction, 
    Counter
} from "@/class";
import * as gistApi from "@/io/apis/gist";
import { ICounterData, IActionData, IPilotLoadoutData, IMechData, IMechState, IOrganizationData, IReserveData, IRankedData, ICounterSaveData } from "@/interface";
import { store } from "@/hooks";
import { ActiveState } from "../mech/ActiveState";
import { MixLinks, MixBuilder, Mixlet, ident } from '@/mixmeta';
import { VCompendiumItem } from '../CompendiumItem';

export interface IPilotData {
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
    mechSkills: number[];
    licenses: IRankedData[];
    skills: IRankedData[];
    talents: IRankedData[];
    core_bonuses: string[];
    reserves: IReserveData[];
    orgs: IOrganizationData[];
    loadout: IPilotLoadoutData;
    mechs: IMechData[];
    active_mech: string | null;
    cc_ver: string;
    counter_data: ICounterSaveData[];
    custom_counters: object[];
    brews: string[];
    state?: IMechState | null;
}
export interface Pilot extends MixLinks<IPilotData> {
    ID: string;

    Callsign: string;
    Name: string;
    PlayerName: string;

    Background: string;
    Notes: string;
    History: string;
    Portrait: string;
    TextAppearance: string;
    Quirk: string;

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
    ActiveMech: string | null;
    CounterData: [];

    CoreBonuses: CoreBonus[];
    Licenses: PilotLicense[];
    MechSkills: MechSkills;
    Reserves: Reserve[];
    Skills: PilotSkill[];
    Talents: PilotTalent[];
    Orgs: Organization[];
    Mechs: Mech[];
    CustomCounters: Counter[];
    State: ActiveState | null;

    Brews: string[];
    CCVersion: string;

    // Methods
    // Updates brew field to reflect all attached content
    SetBrewData(this: Pilot): void;

    // Check if the lancer has any of the following "possessions"
    has(feature: License | CoreBonus | Skill | CustomSkill | Talent | Reserve, rank?: number | null): boolean;

    // Get the rank of the specified skill/talent. Returns 0 if none
    rank(this: Pilot, feature: Skill | CustomSkill | Talent): number;

}

export function CreatePilot(data: IPilotData): Pilot {
    let b = new MixBuilder<Pilot, IPilotData>({
        has,

    });
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Campaign", "campaign", "", ident, ident));
    b.with(new Mixlet("Group", "group", "", ident, ident));
    b.with(new Mixlet("SortIndex", "sort_index", 0, ident, ident));
    b.with(new Mixlet("CloudID", "cloudID", "", ident, ident));
    b.with(new Mixlet("CloudOwnerID", "cloudOwnerID", "", ident, ident));
    b.with(new Mixlet("LastCloudUpdate", "lastCloudUpdate", "", ident, ident));
    b.with(new Mixlet("Level", "level", 0, ident, ident));
    b.with(new Mixlet("Callsign", "callsign", "", ident, ident));
    b.with(new Mixlet("Name", "name", "", ident, ident));
    b.with(new Mixlet("PlayerName", "player_name", "", ident, ident));
    b.with(new Mixlet("Status", "status", "Active", ident, ident));
    b.with(new Mixlet("FactionID", "factionID", "", ident, ident));
    b.with(new Mixlet("TextAppearance", "text_appearance", "", ident, ident));
    b.with(new Mixlet("Notes", "notes", "", ident, ident));
    b.with(new Mixlet("History", "history", "", ident, ident));
    b.with(new Mixlet("Portrait", "portrait", "", ident, ident));
    b.with(new Mixlet("CloudPortrait", "cloud_portrait", "", ident, ident));
    b.with(new Mixlet("Quirk", "quirk", "", ident, ident));
    b.with(new Mixlet("CurrentHP", "current_hp", 0, ident, ident));
    b.with(new Mixlet("Background", "background", "", ident, ident));
    b.with(new Mixlet("MechSkills", "mechSkills", new MechSkills(0,0,0,0), ident, ident));
    b.with(new Mixlet("Licenses", "licenses", [], ident, ident));
    b.with(new Mixlet("Skills", "skills", [], ident, ident));
    b.with(new Mixlet("Talents", "talents", [], ident, ident));
    b.with(new Mixlet("CoreBonuses", "core_bonuses", [], ident, ident));
    b.with(new Mixlet("Reserves", "reserves", [], ident, ident));
    b.with(new Mixlet("Orgs", "orgs", [], ident, ident));
    b.with(new Mixlet("Loadout", "loadout", new PilotLoadout(0), ident, ident));
    b.with(new Mixlet("Mechs", "mechs", [], ident, ident));
    b.with(new Mixlet("ActiveMech", "active_mech", null, ident, ident));
    b.with(new Mixlet("CCVersion", "cc_ver", "", ident, ident));
    b.with(new Mixlet("CounterData", "counter_data", [], ident, ident));
    b.with(new Mixlet("CustomCounters", "custom_counters", [], ident, ident));
    b.with(new Mixlet("Brews", "brews", [], ident, ident));
    b.with(new Mixlet("State", "state", null, ident, ident));

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
        rank?: number | null
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

    // -- Attributes --------------------------------------------------------------------------------
    export function getID(): string {
        return this._id;
    }

    export function RenewID(): void {
        this._id = uuid();
        this._cloudID = "";
        this.save();
    }

    export function getLevel(): number {
        return this._level;
    }

    export function set Level(level: number) {
        this._level = level;
        this.save();
    }

    export function ApplyLevel(update: IPilotData): void {
        this.setPilotData(update);
        this.save();
    }

    export function getPower(): number {
        return (this.Level + 1) * 100;
    }

    export function getFaction(): Faction {
        let v = store.compendium.getReferenceByID("Factions", this._factionID);
        return v;
    }

    export function set Faction(faction: Faction) {
        this._factionID = faction.ID;
        this.save();
    }

    export function getHasIdent(): boolean {
        return !!(this.Name && this.Callsign);
    }

  

    export function getIsUserOwned(): boolean {
        return this.CloudOwnerID === store.user.ID;
    }

    export function SetCloudImage(src: string): void {
        this._cloud_portrait = src;
        this.save();
    }

    export async function CloudSave(): Promise<any> {
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

    export async function CloudLoad(): Promise<any> {
        if (!this.CloudID) return Promise.reject("No Cloud ID");
        return gistApi.loadPilot(this.CloudID).then((gist: any) => {
            this.setPilotData(gist);
            this.LastCloudUpdate = new Date().toString();
        });
    }

    export function CloudCopy(): Promise<any> {
        this.CloudID = "";
        this.CloudOwnerID = "";
        return this.CloudSave();
    }

    export function setCloudInfo(id: string): void {
        this.CloudID = id;
        this.CloudOwnerID = store.user.ID;
        this.LastCloudUpdate = new Date().toString();
    }

    // -- Stats -------------------------------------------------------------------------------------
    export function getGrit(): number {
        return Math.ceil(this._level / 2);
    }

    export function getMaxHP(): number {
        let health = Rules.BasePilotHP + this.Grit;
        this.Loadout.Armor.forEach(x => {
            if (x) health += x.HPBonus;
        });
        return health;
    }

    export function getCurrentHP(): number {
        return this._current_hp;
    }

    export function set CurrentHP(hp: number) {
        if (hp > this.MaxHP) this._current_hp = this.MaxHP;
        else if (hp < 0) this._current_hp = 0;
        else this._current_hp = hp;

        if (this._current_hp === 0) {
            this.Status = "KIA";
        }

        this.save();
    }

    export function Heal(): void {
        this.CurrentHP = this.MaxHP;
    }

    export function getArmor(): number {
        let armor = 0;
        this.Loadout.Armor.forEach(x => {
            if (x) armor += x.Armor;
        });
        return armor;
    }

    export function getSpeed(): number {
        let speed = Rules.BasePilotSpeed;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.Speed) speed = x.Speed;
            speed += x.SpeedBonus;
        });
        return speed;
    }

    export function getEvasion(): number {
        let evasion = Rules.BasePilotEvasion;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.Evasion) evasion = x.Evasion;
            evasion += x.EvasionBonus;
        });
        return evasion;
    }

    export function getEDefense(): number {
        let edef = Rules.BasePilotEdef;
        this.Loadout.Armor.forEach(x => {
            if (!x) return;
            if (x.EDefense) edef = x.EDefense;
            edef += x.EDefenseBonus;
        });
        return edef;
    }

    //TODO: collect passives, eg:
    export function getLimitedBonus(): number {
        let bonus = Math.floor(this.MechSkills.Eng / 2);
        if (this._core_bonuses.find(x => x.ID === "cb_integrated_ammo_feeds")) {
            bonus += 2;
        }
        return bonus;
    }

    export function getAICapacity(): number {
        let tlos = store.compendium.getReferenceByID("CoreBonuses", "cb_the_lesson_of_shaping");
        return this.has(tlos) ? 2 : 1;
    }

    // -- Skills ------------------------------------------------------------------------------------
    export function getSkills(): PilotSkill[] {
        return this._skills;
    }

    export function set Skills(skills: PilotSkill[]) {
        this._skills = skills;
        this.save();
    }

    export function getCurrentSkillPoints(): number {
        return this._skills.reduce((sum, skill) => sum + skill.Rank, 0);
    }

    export function getMaxSkillPoints(): number {
        const bonus = this.Reserves.filter(x => x.ID === "reserve_skill").length;
        return Rules.MinimumPilotSkills + this._level + bonus;
    }

    export function getIsMissingSkills(): boolean {
        return this.CurrentSkillPoints < this.MaxSkillPoints;
    }

    export function getTooManySkills(): boolean {
        return this.CurrentSkillPoints > this.MaxSkillPoints;
    }

    export function getHasFullSkills(): boolean {
        return this.CurrentSkillPoints === this.MaxSkillPoints;
    }

    export function CanAddSkill(skill: Skill | CustomSkill): boolean {
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

    export function AddSkill(skill: Skill | CustomSkill): void {
        const index = this._skills.findIndex(x => _.isEqual(x.Skill, skill));
        if (index === -1) {
            this._skills.push(new PilotSkill(skill));
        } else {
            this._skills[index].Increment();
        }
        this.save();
    }

    export function AddCustomSkill(cs: { skill: string; description: string; detail: string }): void {
        this.AddSkill(new CustomSkill(cs.skill, cs.description, cs.detail));
    }

    export function CanRemoveSkill(skill: Skill | CustomSkill): boolean {
        return this.has(skill);
    }

    export function RemoveSkill(skill: Skill | CustomSkill): void {
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

    export function ClearSkills(): void {
        for (let i = this._skills.length - 1; i >= 0; i--) {
            while (this._skills[i]) {
                this.RemoveSkill(this._skills[i].Skill);
            }
        }
    }

    // -- Talents -----------------------------------------------------------------------------------
    export function getTalents(): PilotTalent[] {
        return this._talents;
    }

    export function set Talents(talents: PilotTalent[]) {
        this._talents = talents;
        this.save();
    }

    export function getCurrentTalentPoints(): number {
        return this._talents.reduce((sum, talent) => sum + talent.Rank, 0);
    }

    export function getMaxTalentPoints(): number {
        return Rules.MinimumPilotTalents + this._level;
    }

    export function getIsMissingTalents(): boolean {
        return this.CurrentTalentPoints < this.MaxTalentPoints;
    }

    export function getTooManyTalents(): boolean {
        return this.CurrentTalentPoints > this.MaxTalentPoints;
    }

    export function getHasFullTalents(): boolean {
        return this.CurrentTalentPoints === this.MaxTalentPoints;
    }

    export function getTalentRank(id: string): number {
        const index = this._talents.findIndex(x => x.Talent.ID === id);
        return index > -1 ? this._talents[index].Rank : 0;
    }

    export function AddTalent(talent: Talent): void {
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

    export function RemoveTalent(talent: Talent): void {
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

    export function ClearTalents(): void {
        for (let i = this._talents.length - 1; i >= 0; i--) {
            while (this._talents[i]) {
                this.RemoveTalent(this._talents[i].Talent);
            }
        }
    }

    private talentSort(): void {
        this._talents = this._talents.sort(function(a, b) {
            return a.Rank === b.Rank ? 0 : a.Rank > b.Rank ? -1 : 1;
        });
    }

    private updateIntegratedTalents(): void {
        this._mechs.forEach(mech => {
            mech.UpdateLoadouts();
        });
    }

    export function getTalentActions(): IAction[] {
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
    export function getCoreBonuses(): CoreBonus[] {
        return this._core_bonuses;
    }

    export function set CoreBonuses(coreBonuses: CoreBonus[]) {
        this._core_bonuses = coreBonuses;
        this.save();
    }

    export function getCurrentCBPoints(): number {
        return this._core_bonuses.length;
    }

    export function getMaxCBPoints(): number {
        return Math.floor(this._level / 3);
    }

    export function getIsMissingCBs(): boolean {
        return this.CurrentCBPoints < this.MaxCBPoints;
    }

    export function getTooManyCBs(): boolean {
        return this.CurrentCBPoints > this.MaxCBPoints;
    }

    export function getHasCBs(): boolean {
        return this.CurrentCBPoints === this.MaxCBPoints;
    }

    export function AddCoreBonus(coreBonus: CoreBonus): void {
        this._core_bonuses.push(coreBonus);
        this.save();
    }

    export function RemoveCoreBonus(coreBonus: CoreBonus): void {
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

    export function ClearCoreBonuses(): void {
        for (let i = this._core_bonuses.length - 1; i >= 0; i--) {
            this.RemoveCoreBonus(this._core_bonuses[i]);
        }
    }

    private removeCoreBonuses(coreBonus: CoreBonus): void {
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
    export function getLicenses(): PilotLicense[] {
        return this._licenses;
    }

    export function set Licenses(licenses: PilotLicense[]) {
        this._licenses = licenses;
        this.save();
    }

    export function LicenseLevel(manufacturerID: string): number {
        return this.Licenses.filter(
            x => x.License.Source.toLowerCase() === manufacturerID.toLowerCase()
        ).reduce((a, b) => +a + +b.Rank, 0);
    }

    export function getCurrentLicensePoints(): number {
        return this._licenses.reduce((sum, license) => sum + license.Rank, 0);
    }

    export function getMaxLicensePoints(): number {
        return this._level;
    }

    export function getIsMissingLicenses(): boolean {
        return this.CurrentLicensePoints < this.MaxLicensePoints;
    }

    export function getTooManyLicenses(): boolean {
        return this.CurrentLicensePoints > this.MaxLicensePoints;
    }

    export function getHasLicenses(): boolean {
        return this.CurrentLicensePoints === this.MaxLicensePoints;
    }

    export function getLicenseRank(_name: string): number {
        const index = this._licenses.findIndex(x => x.License.Name === _name);
        return index > -1 ? this._licenses[index].Rank : 0;
    }

    export function AddLicense(license: License): void {
        const index = this._licenses.findIndex(x => _.isEqual(x.License, license));
        if (index === -1) {
            this._licenses.push(new PilotLicense(license, 1));
        } else {
            this._licenses[index].Increment();
        }
        this.save();
    }

    export function RemoveLicense(license: License): void {
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

    export function ClearLicenses(): void {
        for (let i = this._licenses.length - 1; i >= 0; i--) {
            while (this._licenses[i]) {
                this.RemoveLicense(this._licenses[i].License);
            }
        }
    }

    // -- Mech Skills -------------------------------------------------------------------------------
    export function getMechSkills(): MechSkills {
        return this._mechSkills;
    }

    export function set MechSkills(mechskills: MechSkills) {
        this._mechSkills = mechskills;
        this.save();
    }


    // -- Mechs -----------------------------------------------------------------------------------


    // -- COUNTERS ----------------------------------------------------------------------------------

    private _counterSaveData: ICounterSaveData[] = [];
    export function getCounterSaveData(): ICounterSaveData[] {
        return this._counterSaveData;
    }
    export function saveCounter(inputData: ICounterSaveData): void {
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
    export function getCustomCounterData(): ICounterData[] {
        return this._customCounters || [];
    }

    export function createCustomCounter(name: string): void {
        const counter = {
            name,
            id: uuid(),
            custom: true,
        };
        this._customCounters = [...this._customCounters, counter];
        this.save();
    }

    export function deleteCustomCounter(id: string): void {
        const index = this._customCounters.findIndex(c => c.custom && c.id === id);
        if (index > -1) {
            this._customCounters.splice(index, 1);
            this._customCounters = [...this._customCounters];
        }
        this.save();
    }

    export function getCounterData(): ICounterData[] {
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
export function SetBrewData(override?: string[]): void {
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


export function resetHASE(pilot: Pilot): void {
    this._mechSkills.Reset();
}

export function CurrentHASEPoints(pilot: Pilot): number {
    return this._mechSkills.Sum;
}

export function MaxHASEPoints(pilot: Pilot): number {
    return Rules.MinimumMechSkills + this._level;
}

export function IsMissingHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints < this.MaxHASEPoints;
}

export function TooManyHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints > this.MaxHASEPoints;
}

export function HasFullHASE(pilot: Pilot): boolean {
    return this.CurrentHASEPoints === this.MaxHASEPoints;
}

export function RemoveMech(mech: Mech): void {
        const index = this._mechs.findIndex(x => _.isEqual(x, mech));
        if (index === -1) {
            console.error(`Loadout "${mech.Name}" does not exist on Pilot ${this._callsign}`);
        } else {
            this._mechs.splice(index, 1);
        }
        this.save();
    }

    export function CloneMech(mech: Mech): void {
        const mechData = Mech.Serialize(mech);
        const clone = Mech.Deserialize(mechData, this);
        clone.RenewID();
        clone.Name += "*";
        clone.IsActive = false;
        this._mechs.push(clone);
        this.save();
    }

    
    // Controls the active state. Due to volatility, you should always route methods through the State getter
    export function set ActiveMech(mech: Mech | null) {
        if(mech) {
            this._state = new ActiveState(this);
        } else {
            this._state = null;
        }
    }