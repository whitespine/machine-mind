import { mapValues } from "lodash";

import {
    Manufacturer,
    Faction,
    CoreBonus,
    Frame,
    MechWeapon,
    MechSystem,
    WeaponMod,
    PilotEquipment,
    PilotWeapon,
    PilotArmor,
    PilotGear,
    Talent,
    Tag,
    NpcClass,
    NpcTemplate,
    NpcFeature,
    NpcWeapon,
    NpcReaction,
    NpcTrait,
    NpcSystem,
    NpcTech,
    Reserve,
    Skill,
    License,
    Environment,
    Sitrep,
    Status,
} from "@/class";
import {
    IManufacturerData,
    IFactionData,
    ICoreBonusData,
    IFrameData,
    IMechWeaponData,
    IMechSystemData,
    IWeaponModData,
    IPilotEquipmentData,
    IPilotWeaponData,
    IPilotArmorData,
    IPilotGearData,
    ITalentData,
    INpcClassData,
    INpcFeatureData,
    INpcTemplateData,
    INpcWeaponData,
    INpcReactionData,
    INpcSystemData,
    INpcTechData,
    ITagCompendiumData,
    ISkillData,
    IReserveData,
    IStatusData,
    IEnvironmentData,
    ISitrepData,
} from "@/interface";
import _ from "lodash";

export interface IContentPackManifest {
    name: string;
    item_prefix: string; // Note - this is applied only on initial load. Dynamic, at runtime packs do not care about this
    author: string;
    version: string;
    description?: string | null;
    website?: string | null;
    image_url?: string | null;
}
export interface IContentPackData {
    manufacturers: IManufacturerData[];
    factions: IFactionData[];
    coreBonuses: ICoreBonusData[];
    frames: IFrameData[];
    weapons: IMechWeaponData[];
    systems: IMechSystemData[];
    mods: IWeaponModData[];
    pilotGear: IPilotEquipmentData[];
    talents: ITalentData[];
    tags: ITagCompendiumData[];

    npcClasses: INpcClassData[];
    npcFeatures: INpcFeatureData[];
    npcTemplates: INpcTemplateData[];

    // New additions courtesy of whitespine
    skills?: ISkillData[] | null;
    statuses?: IStatusData[] | null;
    reserves?: IReserveData[] | null;
    environments?: IEnvironmentData[] | null;
    sitreps?: ISitrepData[] | null;
    quirks?: string[] | null;
}

export interface IContentPack {
    id: string;
    active: boolean;
    manifest: IContentPackManifest;
    data: IContentPackData;
}

export class ContentPack {
    private _manifest: IContentPackManifest;
    private _id: string;
    public get ID(): string {
        return this._id;
    }

    public get Name(): string {
        return this._manifest.name;
    }
    public get Author(): string {
        return this._manifest.author;
    }
    public get Version(): string {
        return this._manifest.version;
    }
    public get Description(): string | null {
        return this._manifest.description || null;
    }
    public get Website(): string | null {
        return this._manifest.website || null;
    }
    public get ImageURL(): string | null {
        return this._manifest.image_url || null;
    }

    private _data: IContentPackData;

    private _Manufacturers: Manufacturer[];
    public get Manufacturers(): Manufacturer[] {
        return this._Manufacturers;
    }
    private _Factions: Faction[];
    public get Factions(): Faction[] {
        return this._Factions;
    }

    private _CoreBonuses: CoreBonus[];
    public get CoreBonuses(): CoreBonus[] {
        return this._CoreBonuses;
    }

    private _Frames: Frame[];
    public get Frames(): Frame[] {
        return this._Frames;
    }

    private _MechWeapons: MechWeapon[];
    public get MechWeapons(): MechWeapon[] {
        return this._MechWeapons;
    }

    private _MechSystems: MechSystem[];
    public get MechSystems(): MechSystem[] {
        return this._MechSystems;
    }

    private _WeaponMods: WeaponMod[];
    public get WeaponMods(): WeaponMod[] {
        return this._WeaponMods;
    }

    // Includes gear, weapons, and armor
    private _PilotEquipment: PilotEquipment[];
    public get PilotEquipment(): PilotEquipment[] {
        return this._PilotEquipment;
    }

    private _PilotGear: PilotGear[];
    public get PilotGear(): PilotGear[] {
        return this._PilotGear;
    }

    private _PilotWeapons: PilotWeapon[];
    public get PilotWeapons(): PilotWeapon[] {
        return this._PilotWeapons;
    }

    private _PilotArmor: PilotArmor[];
    public get PilotArmor(): PilotArmor[] {
        return this._PilotArmor;
    }

    private _Talents: Talent[];
    public get Talents(): Talent[] {
        return this._Talents;
    }

    private _Tags: Tag[];
    public get Tags(): Tag[] {
        return this._Tags;
    }

    private _NpcClasses: NpcClass[];
    public get NpcClasses(): NpcClass[] {
        return this._NpcClasses;
    }

    private _NpcTemplates: NpcTemplate[];
    public get NpcTemplates(): NpcTemplate[] {
        return this._NpcTemplates;
    }

    private _NpcFeatures: NpcFeature[];
    public get NpcFeatures(): NpcFeature[] {
        return this._NpcFeatures;
    }

    private _Environments: Environment[];
    public get Environments(): Environment[] {
        return this._Environments;
    }

    private _Reserves: Reserve[];
    public get Reserves(): Reserve[] {
        return this._Reserves;
    }

    private _Sitreps: Sitrep[];
    public get Sitreps(): Sitrep[] {
        return this._Sitreps;
    }

    private _Skills: Skill[];
    public get Skills(): Skill[] {
        return this._Skills;
    }

    private _StatusesAndConditions: Status[];
    public get StatusesAndConditions(): Status[] {
        return this._StatusesAndConditions;
    }

    private _Statuses: Status[];
    public get Statuses(): Status[] {
        return this._Statuses;
    }

    private _Conditions: Status[];
    public get Conditions(): Status[] {
        return this._Conditions;
    }

    private _Quirks: string[];
    public get Quirks(): string[] {
        return this._Quirks;
    }

    private _Licenses: License[];
    public get Licenses(): License[] {
        return this._Licenses;
    }

    private _active: boolean;
    public get Active(): boolean {
        return this._active;
    }
    public SetActive(active: boolean): void {
        this._active = active;
    }

    constructor(pack: IContentPack) {
        const { id, active, manifest, data } = pack;

        this._active = active;
        this._manifest = manifest;
        this._data = mapValues(data, (items: any) => items.map(item => ({ ...item, brew: id })));
        this._id = id;

        this._Manufacturers = this._data.manufacturers?.map(x => new Manufacturer(x)) || [];
        this._Factions = this._data.factions?.map(x => new Faction(x)) || [];
        this._CoreBonuses = this._data.coreBonuses?.map(x => new CoreBonus(x)) || [];
        this._Frames = this._data.frames?.map(x => new Frame(x)) || [];
        this._MechWeapons = this._data.weapons?.map(x => new MechWeapon(x)) || [];
        this._MechSystems = this._data.systems?.map(x => new MechSystem(x)) || [];
        this._WeaponMods = this._data.mods?.map(x => new WeaponMod(x)) || [];

        this._PilotArmor = [];
        this._PilotEquipment = [];
        this._PilotGear = [];
        this._PilotWeapons = [];

        for (let igear of this._data.pilotGear || []) {
            let equip: PilotEquipment;
            if (igear.type === "weapon") {
                let wep = new PilotWeapon(igear as IPilotWeaponData);
                this._PilotWeapons.push(wep);
                equip = wep;
            } else if (igear.type === "armor") {
                let arm = new PilotArmor(igear as IPilotArmorData);
                this._PilotArmor.push(arm);
                equip = arm;
            } else {
                // We assume gear otherwise. should maybe explicitly check
                let gear = new PilotGear(igear as IPilotGearData);
                equip = gear;
                this._PilotGear.push(gear);
            }
            this._PilotEquipment.push(equip);
        }

        this._Talents = this._data.talents?.map(x => new Talent(x)) || [];
        this._Tags = this._data.tags?.map(x => new Tag(x)) || [];

        this._NpcFeatures =
            this._data.npcFeatures?.map(function(x) {
                if (x.type.toLowerCase() === "weapon") return new NpcWeapon(x as INpcWeaponData);
                else if (x.type.toLowerCase() === "reaction")
                    return new NpcReaction(x as INpcReactionData);
                else if (x.type.toLowerCase() === "trait") return new NpcTrait(x);
                else if (x.type.toLowerCase() === "system")
                    return new NpcSystem(x as INpcSystemData);
                return new NpcTech(x as INpcTechData);
            }) || [];
        this._NpcClasses = this._data.npcClasses?.map(x => new NpcClass(x)) || [];
        this._NpcTemplates = this._data.npcTemplates?.map(x => new NpcTemplate(x)) || [];

        this._Quirks = this._data.quirks || [];
        this._Skills = (this._data.skills || []).map(s => new Skill(s));
        this._Sitreps = (this._data.sitreps || []).map(Sitrep.Deserialize);
        this._Reserves = (this._data.reserves || []).map(s => new Reserve(s));
        this._StatusesAndConditions = (this._data.statuses || []).map(Status.Deserialize);
        this._Environments = (this._data.environments || []).map(Environment.Deserialize);
        this._Licenses = this.Frames.map(f => new License(f));

        this._Statuses = this._StatusesAndConditions.filter(s => s.is_status);
        this._Conditions = this._StatusesAndConditions.filter(s => s.is_condition);
    }

    public Serialize(): IContentPack {
        return {
            id: this._id,
            active: this._active,
            manifest: this._manifest,
            data: this._data,
        };
    }
}
