import { Action, Frame, MechWeapon, Pilot } from "@/class";
import { Deployable } from "./classes/Deployable";
import { Environment } from "./classes/encounter/Environment";
import { Sitrep } from "./classes/encounter/Sitrep";
import { Faction } from "./classes/Faction";
import { Manufacturer } from "./classes/Manufacturer";
import { FrameTrait } from './classes/mech/FrameTrait';
import { MechSystem } from "./classes/mech/MechSystem";
import { WeaponMod } from "./classes/mech/WeaponMod";
import { NpcClass } from "./classes/npc/NpcClass";
import { NpcFeature } from "./classes/npc/NpcFeature";
import { NpcTemplate } from "./classes/npc/NpcTemplate";
import { CoreBonus } from "./classes/pilot/CoreBonus";
import { PilotArmor, PilotGear, PilotWeapon } from "./classes/pilot/PilotEquipment";
import { Quirk, RegQuirkData } from "./classes/pilot/Quirk";
import { Reserve } from "./classes/pilot/reserves/Reserve";
import { Skill } from "./classes/pilot/Skill";
import { Talent } from "./classes/pilot/Talent";
import { Status } from "./classes/Statuses";
import { ITagTemplateData, TagTemplate } from "./classes/Tag";
import {
    IActionData,
    ICoreBonusData,
    IDeployableData,
    IEnvironmentData,
    IFactionData,
    IFrameData,
    IManufacturerData,
    IMechSystemData,
    IMechWeaponData,
    INpcClassData,
    INpcFeatureData,
    INpcTemplateData,
    IPilotArmorData,
    IPilotData,
    IPilotEquipmentData,
    IPilotGearData,
    IPilotWeaponData,
    IReserveData,
    ISitrepData,
    ISkillData,
    IStatusData,
    ITalentData,
    IWeaponModData,
} from "./interface";

///// TYPE MAAPPINGS /////
// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, EntryType, and brew
export enum EntryType {
    CORE_BONUS = "CoreBonuses",
    CORE_SYSTEM = "CoreSystems",
    DEPLOYABLE = "Deployables",
    FACTION = "Factions",
    FRAME = "Frames",
    FRAME_TRAIT = "FrameTraits",
    MECH = "Mechs", // Mech actors
    // LICENSE = "Licenses",
    MANUFACTURER = "Manufacturers",
    NPC_CLASS = "NpcClasses",
    NPC_TEMPLATE = "NpcTemplates",
    NPC_FEATURE = "NpcFeatures",
    WEAPON_MOD = "WeaponMods",
    MECH_WEAPON = "MechWeapons",
    MECH_SYSTEM = "MechSystems",
    PILOT_GEAR = "PilotGear",
    PILOT_ARMOR = "PilotArmor",
    PILOT_WEAPON = "PilotWeapons",
    TALENT = "Talents",
    SKILL = "Skills",
    STATUS = "Statuses",
    CONDITION = "Conditions",
    QUIRK = "Quirks",
    RESERVE = "Reserves",
    ENVIRONMENT = "Environments",
    SITREP = "Sitreps",
    TAG = "Tags",
    PILOT = "Pilot",
}

type _RegTypeMap = { [key in EntryType]: object };
export interface RegEntryTypes extends _RegTypeMap {
    [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: ICoreBonusData;
    [EntryType.DEPLOYABLE]: IDeployableData;
    [EntryType.ENVIRONMENT]: IEnvironmentData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: IFrameData;
    [EntryType.MANUFACTURER]: IManufacturerData;
    [EntryType.MECH_SYSTEM]: IMechSystemData;
    [EntryType.MECH_WEAPON]: IMechWeaponData;
    [EntryType.NPC_CLASS]: INpcClassData;
    [EntryType.NPC_FEATURE]: INpcFeatureData;
    [EntryType.NPC_TEMPLATE]: INpcTemplateData;
    [EntryType.PILOT_ARMOR]: IPilotArmorData;
    [EntryType.PILOT_GEAR]: IPilotGearData;
    [EntryType.PILOT_WEAPON]: IPilotWeaponData;
    [EntryType.RESERVE]: IReserveData;
    [EntryType.PILOT]: IPilotData;
    [EntryType.SITREP]: ISitrepData;
    [EntryType.SKILL]: ISkillData;
    [EntryType.STATUS]: IStatusData;
    [EntryType.TAG]: ITagTemplateData;
    [EntryType.TALENT]: ITalentData;
    [EntryType.QUIRK]: RegQuirkData;
    [EntryType.WEAPON_MOD]: IWeaponModData;
}

type _LiveTypeMap = { [key in EntryType]: RegEntry<key, any> };
export interface LiveEntryTypes extends _LiveTypeMap {
    [EntryType.CONDITION]: Status;
    [EntryType.CORE_BONUS]: CoreBonus;
    [EntryType.DEPLOYABLE]: Deployable;
    [EntryType.ENVIRONMENT]: Environment;
    [EntryType.FACTION]: Faction;
    [EntryType.FRAME]: Frame;
    [EntryType.FRAME_TRAIT]: FrameTrait;
    [EntryType.MANUFACTURER]: Manufacturer;
    [EntryType.MECH_SYSTEM]: MechSystem;
    [EntryType.MECH_WEAPON]: MechWeapon;
    [EntryType.NPC_CLASS]: NpcClass;
    [EntryType.NPC_FEATURE]: NpcFeature;
    [EntryType.NPC_TEMPLATE]: NpcTemplate;
    [EntryType.PILOT_ARMOR]: PilotArmor;
    [EntryType.PILOT_GEAR]: PilotGear;
    [EntryType.PILOT_WEAPON]: PilotWeapon;
    [EntryType.RESERVE]: Reserve;
    [EntryType.PILOT]: Pilot;
    [EntryType.SITREP]: Sitrep;
    [EntryType.SKILL]: Skill;
    [EntryType.STATUS]: Status;
    [EntryType.TAG]: TagTemplate;
    [EntryType.TALENT]: Talent;
    [EntryType.QUIRK]: Quirk;
    [EntryType.WEAPON_MOD]: WeaponMod;
}

///// REGISTRY SAVE/LOADING /////
export abstract class SerUtil {
    public static deser_actions(actions: IActionData[] | undefined): Action[] {
        return (actions || []).map(a => new Action(a));
    }

    public static restrict_choices<T extends string>(
        choices: T[],
        default_choice: T,
        provided?: string
    ): T {
        return choices.includes(provided as T) ? (provided as T) : default_choice;
    }

    public static restrict_enum<T extends string>(
        enum_: { [key: string]: T },
        default_choice: T,
        provided: string
    ): T {
        let choices = Object.keys(enum_).map(k => enum_[k]);
        return this.restrict_choices(choices, default_choice, provided);
    }
}

// Simple serialization and deserialization
export abstract class SimSer<S> {
    // Setup
    constructor(data: S) {
        this.load(data);
    }

    // Populate this item with stuff
    protected abstract load(data: S): void;

    // Export this item for registry saving back to registry
    public abstract save(): S;
}

// Serialization and deserialization requires a registry, but is not itself an entry.
export abstract class RegSer<SourceType> {
    public readonly Registry: Registry;
    private _load_promise: Promise<any>;

    // Setup
    constructor(registry: Registry, data: SourceType) {
        this.Registry = registry;
        this._load_promise = this.load(data);
    }

    // Async ready check
    public async ready(): Promise<void> {
        await this._load_promise;
    }

    // Populate this item with stuff
    protected abstract async load(data: SourceType): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<SourceType>;
}

// Serialization and deserialization requires a registry
// Also, this item itself lives in the registry
export const CREATE_ENTRY = Symbol("create");
export const LOAD_ENTRY = Symbol("load");
export abstract class RegEntry<T extends EntryType, SourceType> {
    public readonly Type: T;
    public readonly RegistryID: string;
    readonly Registry: Registry;
    private _load_promise: Promise<any>;

    // This constructor assumes that we've already got an entry in this registry.
    // If we don't, then just temporarily fool this item into thinking we do by giving a fake id then changing it via any (note: this is spooky. make sure you imp right)
    constructor(type: T, registry: Registry, id: string, reg_data: SourceType) {
        this.Type = type;
        this.Registry = registry;
        this.RegistryID = id;

        // Load
        this._load_promise = this.load(reg_data);
    }
    // Async ready check
    public async ready(): Promise<void> {
        await this._load_promise;
    }

    // Make a reference to this item
    public as_ref(): RegRef<T> {
        return {
            id: this.RegistryID,
            type: this.Type,
        };
    }

    // Populate this item with stuff
    protected abstract async load(data: SourceType): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<SourceType>;
}

//////// REGISTRY //////
// If raw is supplied as undefined, produce a desired default value
export type CreationFunc<RawType, LiveType> = (reg: Registry, raw?: RawType) => Promise<LiveType>;

export abstract class RegCat<T extends EntryType> {
    // Need this to key them because we can't really identify otherwise
    cat: T;

    // Creation func needed to create live entries
    creation_func: CreationFunc<RegEntryTypes[T], LiveEntryTypes[T]>;

    // Need this for like, basically everything
    parent: Registry;

    constructor(
        parent: Registry,
        cat: T,
        creator: CreationFunc<RegEntryTypes[T], LiveEntryTypes[T]>
    ) {
        this.parent = parent;
        this.cat = cat;
        this.creation_func = creator;
    }

    // Fetches the specific raw item of a category by its ID
    abstract async get_raw(id: string): Promise<RegEntryTypes[T] | null>;

    // Fetches all raw items of a category
    abstract async list_raw(): Promise<Array<RegEntryTypes[T]>>;

    // Instantiates a live interface of the specific raw item. Convenience wrapper
    abstract async get_live(id: string): Promise<RegEntryTypes[T] | null>;

    // Save the given live item, propagating any changes made to it to the backend data source
    // Should NOT accept new items, as we don't know that they will play nice with
    abstract async update(...items: LiveEntryTypes[T][]): Promise<void>;

    // Delete the given id in the given category. Return deleted item, or null if not found
    abstract async delete_id(id: string): Promise<RegEntryTypes[T] | null>;

    // Create a new entry in the database with the specified data. Generally, you cannot control the output ID
    abstract async create(
        ...vals: Array<RegEntry<T, RegEntryTypes[T]>>
    ): Promise<LiveEntryTypes[T][]>;

    // Create a new entry in the database with the creation func's default data. Generally, you cannot control the output ID
    abstract async create_default(): Promise<LiveEntryTypes[T]>;
}

export type CatBuilder<T extends EntryType> = (reg: Registry) => RegCat<T>;
export type CatBuilders = { [key in EntryType]: CatBuilder<key> };

export class Registry {
    // This just maps to the other cats below
    private cat_map: Map<EntryType, RegCat<any>>; // We cannot definitively type this here, unfortunately. If you need definitives, use the below

    constructor(builders: CatBuilders) {
        // Setup mappings. Cumbersome, but it is what it is
        this.cat_map = new Map();
        for (let entry_type of Object.values(EntryType)) {
            let cat = builders[entry_type](this);
            this.cat_map.set(cat.cat, cat);
        }
    }

    // Puts a single value. Gives back the put item's ID
    async create<T extends EntryType>(
        val: RegEntry<T, LiveEntryTypes[T]>
    ): Promise<LiveEntryTypes[T]> {
        let t = val.Type;
        return this.get_cat(t).create(val);
    }

    // Call this only if the registry categories aren't polling from some external source
    async create_many(...vals: RegEntry<any, any>[]): Promise<void> {
        // As a courtesy / optimization measure, we categorize these first, then send in batches
        let groupings = new Map<EntryType, Array<RegEntry<any, any>>>();
        for (let v of vals) {
            if (groupings.has(v.Type)) {
                groupings.get(v.Type)!.push(v);
            } else {
                groupings.set(v.Type, [v]);
            }
        }

        // Dispatch groups
        for (let [k, v] of groupings.entries()) {
            this.get_cat(k).create(...v);
        }
    }

    // Delete an item, by cat + id. Just delegates through get_cat
    async delete(cat: EntryType, id: string) {
        this.get_cat(cat).delete_id(id);
    }

    // Fetch the specified category or error if it doesn't exist
    get_cat<T extends EntryType>(cat: T): RegCat<T> {
        let v = this.cat_map.get(cat);
        if (!v) {
            throw new Error(`Error: Category "${cat}" not setup`);
        }
        return v;
    }

    // Get by ID from _anywhere_. This is pretty funky/unreliable/slow, depending on implementation, because it just polls all categories
    // You should be able to figure out the type from the `Type` of the VRegistryItem
    async get_from_anywhere(id: string): Promise<RegEntry<any, any> | null> {
        for (let [k, c] of this.cat_map) {
            let v = await c.get_live(k);
            if (v) {
                return v;
            }
        }
        return null;
    }

    async resolve<T extends EntryType>(ref: RegRef<T>): Promise<LiveEntryTypes[T] | null> {
        return this.get_cat(ref.type).get_live(ref.id);
    }

    // Filters null results
    async resolve_many<T extends EntryType>(refs: RegRef<T>[]): Promise<Array<LiveEntryTypes[T]>> {
        let resolves = await Promise.all(refs.map(r => this.get_cat(r.type).get_live(r.id)));
        return resolves.filter(d => d != null) as LiveEntryTypes[T][];
    }
}

// Handles cross referencing of data
export interface RegRef<T extends EntryType> {
    // The item id
    id: string;

    // The category we are referencing
    type: T;
}
