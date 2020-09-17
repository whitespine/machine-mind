import lodash, { uniqueId } from "lodash";
import * as lancerData from "@/classes/utility/typed_lancerdata";
import {
    Skill,
    Reserve,
    ContentPack,
    NpcClass,
    NpcTemplate,
    NpcFeature,
    Talent,
    CoreBonus,
    Frame,
    Manufacturer,
    Faction,
    MechWeapon,
    WeaponMod,
    MechSystem,
    PilotWeapon,
    PilotArmor,
    PilotGear,
    Tag,
    License,
    Status,
    Environment,
    Sitrep,
} from "@/class";
import { logger } from "@/hooks";
import { PilotEquipment } from "@/classes/pilot/PilotEquipment";
import { CompendiumItem, CORE_BREW_ID } from "@/classes/CompendiumItem";
import { IContentPack } from "@/classes/ContentPack";
import {
    AbsStoreModule,
    load_setter_handler,
    DataStoreOptions,
    DEFAULT_STORE_OPTIONS,
} from "./store_module";
import { PersistentStore } from "@/io/persistence";
import { NpcTrait } from "@/classes/npc/NpcTrait";
import { NpcWeapon } from "@/classes/npc/NpcWeapon";
import { NpcFeatureType } from "@/classes/npc/NpcFeature";
import { quirks } from "lancer-data";
import {
    DamageType,
    MechType,
    MountType,
    RangeType,
    SystemType,
    WeaponSize,
    WeaponType,
} from "@/classes/enums";
import { IDamageData } from "@/classes/Damage";
import { IRangeData } from "@/classes/Range";
import { ITagCompendiumData } from "@/classes/Tag";
import { ITagData } from "@/classes/GeneralInterfaces";
import { ICounterData } from "@/classes/Counter";

const CORE_BONUSES = "CoreBonuses";
const FACTIONS = "Factions";
const FRAMES = "Frames";
const LICENSES = "Licenses";
const MANUFACTURERS = "Manufacturers";
const NPC_CLASSES = "NpcClasses";
const NPC_TEMPLATES = "NpcTemplates";
const NPC_FEATURES = "NpcFeatures";
const WEAPON_MODS = "WeaponMods";
const MECH_WEAPONS = "MechWeapons";
const MECH_SYSTEM = "MechSystems";
const PILOT_GEAR = "PilotGear";
const PILOT_ARMOR = "PilotArmor";
const PILOT_WEAPONS = "PilotWeapons";
const PILOT_EQUIPMENT = "PilotEquipment";
const TALENTS = "Talents";
const SKILLS = "Skills";
const STATUSES_AND_CONDITIONS = "StatusesAndConditions";
const STATUSES = "Statuses"; // excludes conditions
const CONDITIONS = "Conditions"; // excludes statuses
const QUIRKS = "Quirks";
const RESERVES = "Reserves";
const ENVIRONMENTS = "Environments";
const SITREPS = "Sitreps";
const TAGS = "Tags";
export const FILEKEY_CONTENT_PACKS = "extra_content.json";

// Contains the core compendium data
export class Compendium {
    [CORE_BONUSES]: CoreBonus[] = [];
    [FACTIONS]: Faction[] = [];
    [FRAMES]: Frame[] = [];
    [MANUFACTURERS]: Manufacturer[] = [];
    [NPC_CLASSES]: NpcClass[] = [];
    [NPC_TEMPLATES]: NpcTemplate[] = [];
    [NPC_FEATURES]: NpcFeature[] = [];
    [WEAPON_MODS]: WeaponMod[] = [];
    [MECH_WEAPONS]: MechWeapon[] = [];
    [MECH_SYSTEM]: MechSystem[] = [];
    [TALENTS]: Talent[] = [];
    [SKILLS]: Skill[] = [];
    [STATUSES_AND_CONDITIONS]: Status[] = [];
    [RESERVES]: Reserve[] = [];
    [ENVIRONMENTS]: Environment[] = [];
    [SITREPS]: Sitrep[] = [];
    [TAGS]: Tag[] = [];
    [LICENSES]: License[] = []; // Come from frames
    [PILOT_GEAR]: PilotGear[] = [];
    [PILOT_ARMOR]: PilotArmor[] = []; // Come from pilot gear
    [PILOT_WEAPONS]: PilotWeapon[] = []; // Come from pilot gear
    [PILOT_EQUIPMENT]: PilotEquipment[] = []; // Come from pilot gear
    [STATUSES]: Status[] = []; // Come from statuses
    [CONDITIONS]: Status[] = []; // Come from statuses

    // These are not ID'd
    [QUIRKS]: string[] = [];
}

export interface ICompendium extends Compendium {}

// Shorthand for valid compendium types
export type CompendiumCategory = keyof ICompendium;

// All the keys specifically in content packs. Note that some of these items are missing/ not yet able to be homebrewed
export const PackKeys: Array<keyof ContentPack & keyof Compendium> = [
    CORE_BONUSES,
    FACTIONS,
    FRAMES,
    LICENSES,
    MANUFACTURERS,
    NPC_CLASSES,
    NPC_TEMPLATES,
    NPC_FEATURES,
    WEAPON_MODS,
    MECH_WEAPONS,
    MECH_SYSTEM,
    PILOT_GEAR,
    PILOT_ARMOR,
    PILOT_WEAPONS,
    PILOT_EQUIPMENT,
    TALENTS,
    SKILLS,
    STATUSES_AND_CONDITIONS,
    STATUSES,
    CONDITIONS,
    RESERVES,
    ENVIRONMENTS,
    SITREPS,
    TAGS,
    QUIRKS,
];

// This is all compendium keys, IE items that  you can lookup by collection (and sometimes ID)
export const CompendiumKeys: CompendiumCategory[] = Object.keys(new Compendium()) as any;

// So we don't have to treat it separately
export function getBaseContentPack(): ContentPack {
    // lancerData.
    return new ContentPack({
        active: true,
        id: CORE_BREW_ID,
        manifest: {
            author: "Massif-Press",
            item_prefix: "", // Don't want one
            name: "Lancer Core Book Data",
            version: "1.X",
        },
        data: {
            coreBonuses: lancerData.core_bonuses,
            factions: lancerData.factions,
            frames: lancerData.frames,
            manufacturers: lancerData.manufacturers,
            mods: lancerData.mods,
            npcClasses: lancerData.npc_classes,
            npcFeatures: lancerData.npc_features,
            npcTemplates: lancerData.npc_templates,
            pilotGear: lancerData.pilot_gear,
            systems: lancerData.systems,
            tags: lancerData.tags,
            talents: lancerData.talents,
            weapons: lancerData.weapons,

            quirks: lancerData.quirks,
            environments: lancerData.environments,
            reserves: lancerData.reserves,
            sitreps: lancerData.sitreps,
            skills: lancerData.skills,
            statuses: lancerData.statuses,
        },
    });
}

export class CompendiumStore extends AbsStoreModule {
    // Pack management - note that we break here from the compcon way of doing it, and do not automatically save content after changes, to be more consistent with other platforms
    public _content_packs: ContentPack[] = []; // Currently loaded custom content packs.

    // Should we always include the core data?
    private _include_core: boolean = true;

    // Should we attempt to provide dummy systems etc if unable to lookup?
    private _shim_default_items: boolean = false;

    public get ContentPacks(): ContentPack[] {
        return this._content_packs;
    }

    // Delete the specified pack from loaded state
    // Automatically reloads data
    public deleteContentPack(packID: string): void {
        let i = this._content_packs.findIndex(p => p.ID == packID);
        if (i !== -1) {
            this._content_packs.splice(i, 1);
        }
        this.populate();
        this.saveData();
    }

    public constructor(persistence: PersistentStore, options: DataStoreOptions) {
        super(persistence, options);
        this._include_core = !options.disable_core_data;
        this._shim_default_items = options.shim_fallback_items;
    }

    // Add the given pack to loaded state. Replaces existing packs with given id
    // Automatically reloads data
    public addContentPack(pack: ContentPack): void {
        // Get existing index if any
        let i = this._content_packs.findIndex(p => p.ID == pack.ID);

        // If present, replace
        if (i !== -1) {
            let [replaced] = this._content_packs.splice(i, 1, pack);
            logger(
                `Replacing pack ${replaced.Name}:${replaced.Version} with ${pack.Name}:${pack.Version}`
            );
        } else {
            // Otherwise just push
            this._content_packs.push(pack);
        }
        this.populate();
        this.saveData();
    }

    // Flag a pack as active in the loaded state. Automatically reloads pack data
    public setPackActive(packID: string, active: boolean): void {
        // Set the specified pack as active
        let pack = this._content_packs.find(p => p.ID === packID);
        if (pack) {
            pack.SetActive(active);
        }
        this.populate();
        this.saveData();
    }

    // We can implement this mgmt functions here, regardless of anything else
    public packAlreadyInstalled(packID: string): boolean {
        return this._content_packs.some(p => p.ID == packID);
    }

    // Amends the custom content packs with the base
    private get getAll_content_packs(): ContentPack[] {
        if (this._include_core) {
            return [getBaseContentPack(), ...this._content_packs];
        } else {
            return [...this._content_packs];
        }
    }

    // (Re)loads the base lancer data, as well as any additional content packs data, from currently loaded packs/core data
    // We'll want to call this after any pack changes, to ensure data is properly updated.
    public populate(): void {
        // Get a fresh compendium
        let comp = new Compendium();

        // Load data from pack
        for (let pack of this.getAll_content_packs.filter(p => p.Active)) {
            // Just do this part via iteration
            for (let k of PackKeys) {
                // Get the items
                let items = pack[k];

                // Push them on
                if (items) {
                    comp[k].push(...(items as any));
                } else {
                    logger(`Error: Content pack missing ${k} array`);
                }
            }
        }

        // Set compendium
        this.compendium = comp;

        // Update frame licenses
        for (let l of comp[LICENSES]) {
            l.updateUnlocks();
        }
    }

    public compendium: Compendium = new Compendium();

    // This variant panics on null
    public instantiate<T extends CompendiumCategory>(itemType: T, id: string): ICompendium[T][0] {
        let v = this.instantiateCareful(itemType, id);
        if (!v) {
            throw new TypeError(`Could not create item ${id} of category ${itemType}`);
        }
        return v;
    }

    // Instantiate an item from a collection
    // Note that functionally, this is just getReferenceByID except if you want to change it afterwards (e.g. an NPC)
    public instantiateCareful<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): ICompendium[T][0] | null {
        let v = this.getReferenceByIDCareful(itemType, id);
        if (!v) {
            return v;
        } else {
            return lodash.cloneDeep(v);
        }
    }

    // Get a specific item from an item collection
    // public getReferenceByID<T>(itemType: LookupType, id: string): T | { err: string } { // Can we make this generic work?
    public getReferenceByIDCareful<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): ICompendium[T][0] | null {
        const items = this.getItemCollection(itemType);
        // Typescript cannot consolidate predicates, so we treat as any.
        let i = (items as Array<any>).find(x => x.ID === id || x.id === id);

        if (this._shim_default_items && i === null) {
            // We gotta shim
            i = this.gen_default_item(id, itemType) as T;
        }
        return i || null;
    }

    // Panic on null
    public getReferenceByID<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): ICompendium[T][0] {
        let v = this.getReferenceByIDCareful(itemType, id);
        if (!v) {
            throw new TypeError(`Invalid item ${id} of category ${itemType}`);
        }
        return v;
    }

    // Get the item collection of the provided type
    public getItemCollection<T extends CompendiumCategory>(itemType: T): ICompendium[T] {
        return this.compendium[itemType];
    }

    public async loadData(handler: load_setter_handler<CompendiumStore>): Promise<void> {
        // Load the contact packs themselves from static storage
        let ser_packs =
            (await this.persistence.get_item<IContentPack[]>(FILEKEY_CONTENT_PACKS)) || [];
        let deser = ser_packs.map(cp => new ContentPack(cp));

        // Set when able
        handler(cs => {
            cs._content_packs = deser;
            cs.populate();
        });
    }

    public async saveData(): Promise<void> {
        // Save the content packs to static storage
        let data_packs = this._content_packs.map(ContentPack.Serialize);
        await this.persistence.set_item(FILEKEY_CONTENT_PACKS, data_packs);
    }

    gen_default_item(id: string, item_category: CompendiumCategory): any {
        const source = "Unknown Source";
        const brew = "unknown";
        const license = "unknown";
        const effect = "Unknown effect";
        const detail = "Unknown detail";
        const counters = [] as ICounterData[];
        const effects = [effect] as string[];
        const description = "Unrecognized " + item_category;
        const damage: IDamageData[] = [{ type: DamageType.Kinetic, val: "1" }];
        const range: IRangeData[] = [{ type: RangeType.Range, val: 8 }];
        const tags = [] as ITagData[];
        const name = `//${id}//`;
        const logo = "gms";
        const icon = "jammed";
        const color = "grey";
        const quote = "Unknown quote";
        const sp = 1;
        const license_level = 0;

        switch (item_category) {
            case CORE_BONUSES:
                return new CoreBonus({
                    source,
                    brew,
                    counters,
                    description,
                    effect,
                    name,
                    id,
                });
            case FACTIONS:
                return new Faction({
                    name,
                    color,
                    description,
                    id,
                    logo,
                });
            case FRAMES:
                return new Frame({
                    brew,
                    counters,
                    description,
                    id,
                    license,
                    license_level,
                    mechtype: [MechType.Balanced],
                    mounts: [MountType.Main],
                    name,
                    source,
                    traits: [],
                    stats: {
                        armor: 0,
                        edef: 8,
                        evasion: 8,
                        heatcap: 5,
                        hp: 8,
                        repcap: 5,
                        save: 10,
                        sensor_range: 10,
                        size: 1,
                        sp: 5,
                        speed: 5,
                        tech_attack: 0,
                    },
                    core_system: {
                        active_effect: effect,
                        active_name: name,
                        description,
                        name,
                        tags,
                    },
                });

                break;
            case LICENSES:
                return new License(this.gen_default_item(id, "Frames"));
            case MANUFACTURERS:
                return new Manufacturer({
                    id,
                    name,
                    logo,
                    color,
                    description,
                    quote,
                });
            case NPC_CLASSES:
                const dup = <T>(x: T): [T, T, T] => {
                    return [x, x, x];
                };
                return new NpcClass({
                    base_features: [],
                    brew,
                    id,
                    info: { flavor: description, tactics: description },
                    name,
                    optional_features: [],
                    power: 100,
                    role: "striker",
                    stats: {
                        activations: dup(1),
                        agility: dup(0),
                        armor: dup(0),
                        edef: dup(8),
                        engineering: dup(0),
                        evade: dup(8),
                        heatcap: dup(8),
                        hp: dup(8),
                        hull: dup(0),
                        save: dup(10),
                        sensor: dup(10),
                        size: dup([1]),
                        speed: dup(5),
                        systems: dup(0),
                    },
                });
            case NPC_TEMPLATES:
                return new NpcTemplate({
                    power: 100,
                    base_features: [],
                    brew,
                    description,
                    id,
                    name,
                    optional_features: [],
                });
            case NPC_FEATURES:
                return new NpcTrait({
                    brew,
                    hide_active: false,
                    id,
                    locked: false,
                    name,
                    tags: [],
                    type: NpcFeatureType.Trait,
                    origin: {
                        base: true,
                        name,
                        type: "unknown",
                    },
                });
            case WEAPON_MODS:
                return new WeaponMod({
                    name,
                    description,
                    id,
                    sp,
                    applied_string: description,
                    applied_to: [WeaponType.Rifle],
                    brew,
                    counters,
                    effect,
                    license,
                    license_level: 0,
                    restricted_mounts: [],
                    source,
                    tags,
                });
            case MECH_WEAPONS:
                return new MechWeapon({
                    name,
                    description,
                    id,
                    mount: WeaponSize.Main,
                    counters,
                    brew,
                    damage,
                    effect,
                    type: WeaponType.Rifle,
                    tags,
                    source,
                    range,
                    sp: 0,
                    license_level,
                    license,
                });
            case MECH_SYSTEM:
                return new MechSystem({
                    name,
                    description,
                    id,
                    tags,
                    source,
                    license_level,
                    license,
                    effect,
                    counters,
                    sp,
                    brew,
                    type: SystemType.System,
                });
            case PILOT_GEAR:
                return new PilotGear({ name, description, id, brew, counters, tags });
            case PILOT_ARMOR:
                return new PilotArmor({ name, description, id, tags, brew, counters });
            case PILOT_WEAPONS:
                return new PilotWeapon({
                    name,
                    description,
                    id,
                    counters,
                    brew,
                    damage,
                    tags,
                    range,
                });
            case PILOT_EQUIPMENT:
                return this.gen_default_item(id, "PilotGear");
            case TALENTS:
                return new Talent({
                    brew,
                    counters,
                    description,
                    id,
                    name,
                    ranks: [
                        {
                            description: effect,
                            name: "Rank 1",
                        },
                        {
                            description: effect,
                            name: "Rank 2",
                        },
                        {
                            description: effect,
                            name: "Rank 3",
                        },
                    ],
                });
            case SKILLS:
                return new Skill({
                    brew,
                    counters,
                    name,
                    detail,
                    description,
                    id,
                    family: "unknown",
                });
            case STATUSES_AND_CONDITIONS:
                return Status.Deserialize({ name, type: "Status", icon, effects });
            case STATUSES:
                return Status.Deserialize({ name, type: "Status", icon, effects });
            case CONDITIONS:
                return Status.Deserialize({ name, type: "Condition", icon, effects });
            case QUIRKS:
                return "unknown quirk";
            case RESERVES:
                return new Reserve({
                    id,
                    used: false,
                    description,
                    name,
                });
            case ENVIRONMENTS:
                return new Environment();
            case SITREPS:
                return new Sitrep();
            case TAGS:
                return new Tag({ brew, counters, name, id, description });
        }
    }
}
