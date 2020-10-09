import * as lancerData from "@/classes/utility/typed_lancerdata";
import type {
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
    TagTemplate,
    Status,
    Environment,
    Sitrep, PilotEquipment, Deployable, Quirk, Pilot
} from "@/class";
import { CORE_BREW_ID } from '@/classes/enums';
import type { ICoreBonusData, IEnvironmentData, IFactionData, IFrameData, IManufacturerData, IMechSystemData, IMechWeaponData, INpcClassData, INpcFeatureData, INpcTemplateData, IPilotArmorData, IPilotEquipmentData, IPilotGearData, IPilotWeaponData, ISitrepData, ISkillData, ITagTemplateData, ITalentData, IWeaponModData, IStatusData, IDeployableData, IQuirkData, IPilotData, IReserveData } from '@/interface';
import { def_empty_map, MixLinks } from '@/mixmeta';


/*
Contains logic for looking up item templates by ID, or for examining lists of options
Everything herein implements VCompendiumItem
*/

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, EntryType, and brew
export enum EntryType {
    None = "",
    CORE_BONUS = "CoreBonuses",
    DEPLOYABLE = "Deployables",
    FACTION = "Factions",
    FRAME = "Frames",
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
    PILOT_EQUIPMENT = "PilotEquipment",
    TALENT = "Talents",
    SKILL = "Skills",
    STATUS = "Statuses", 
    CONDITION = "Conditions",
    QUIRK = "Quirks",
    RESERVE = "Reserves",
    ENVIRONMENT = "Environments",
    SITREP = "Sitreps",
    TAG = "Tags",
    PILOT = "Pilot"
}

// Use this constant for if we do not yet know what to populate the ID field with.
export const ID_ANONYMOUS = Symbol("anon");

// Takes mixlinks ever so slightly further by requiring a type and a machine-mind ID
// If something is going to be stored in the registry AND require serialization/deserialization from there, use this
export interface VRegistryItem<I extends object> extends MixLinks<I>{
    readonly Type: EntryType;
    // MMID: string | typeof ID_ANONYMOUS; // Anonymous if not from a content pack and hasn't been explicitly named. Note that this is _NOT_ the id in the registry
}

// A reference to another entry in the registry.
export interface RegistryReference<T extends EntryType> { // We don't care super much about anything else
    type: T;
    registry_id: string;
}

// Holds a live version of an item, wrapping it in metadata so we know where it came from
export class RegistryHandle<T extends EntryType> { // We don't care super much about anything else
    readonly registry_id: string; // This is the actual ID used for lookup
    // readonly Brew: string; // todo
    readonly registry: Registry;
    item: LiveTypeMapping[T];

    // Construct our handle. No side effects
    constructor(id: string, registry: Registry, item: LiveTypeMapping[T]) {
        this.registry_id = id;
        this.registry = registry;
        this.item = item;
    }

    // Asks our registry to delete us. Return our wrapped item
    async delete(): Promise<LiveTypeMapping[T]> {
        await this.registry.get_cat(this.item.Type).delete_id(this.registry_id);
        return this.item;
    }
}


// Use these for fetching registry references in other registry items
export async function RegistryFetcher<T extends EntryType>(refs: RegistryReference<T>[], reg: Registry): Promise<RegistryHandle<T>[]> {
    let fetched: RegistryHandle<T>[] = [];
    for(let r of refs) {
        let f = await reg.get_cat(r.type).get_live(r.registry_id);
        if(f === null) {
            console.error(`Failed to recover registry ref id ${r.type}[${r.registry_id}]`);
        } else {
            fetched.push(f);
        }
    }
    return fetched;
}

export async function RegistrySaver<T extends EntryType>(refs: RegistryHandle<T>[], reg: Registry): Promise<RegistryHandle<T>[]> {
    let fetched: RegistryHandle<T>[] = [];
    for(let r of refs) {
        let f = await reg.get_cat(r.type).get_live(r.registry_id);
        if(f === null) {
            console.error(`Failed to recover registry ref id ${r.type}[${r.registry_id}]`);
        } else {
            fetched.push(f);
        }
    }
    return fetched;
}

// We use this mapping to map Entry items to raw data types
type RawSuper = {[key in EntryType]: any};
interface RawTypeMapping extends RawSuper{
    [EntryType.CORE_BONUS]: ICoreBonusData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: IFrameData;
    [EntryType.MANUFACTURER]: IManufacturerData;
    [EntryType.NPC_CLASS]: INpcClassData;
    [EntryType.NPC_TEMPLATE]: INpcTemplateData;
    [EntryType.NPC_FEATURE]: INpcFeatureData;
    [EntryType.WEAPON_MOD]: IWeaponModData;
    [EntryType.MECH_WEAPON]: IMechWeaponData;
    [EntryType.MECH_SYSTEM]: IMechSystemData;
    [EntryType.TALENT]: ITalentData;
    [EntryType.SKILL]: ISkillData ;
    [EntryType.RESERVE]: IReserveData ;
    [EntryType.ENVIRONMENT]: IEnvironmentData ;
    [EntryType.SITREP]: ISitrepData ;
    [EntryType.TAG]: ITagTemplateData ;
    // [EntryType.LICENSES]: ILicenseData ;  // As it turns out there's no reason for licenses to persistently exist, really...
    [EntryType.PILOT_GEAR]: IPilotGearData ;
    [EntryType.PILOT_ARMOR]: IPilotArmorData ;
    [EntryType.PILOT_WEAPON]: IPilotWeaponData ;
    [EntryType.PILOT_EQUIPMENT]: IPilotEquipmentData ;
    [EntryType.STATUS]: IStatusData ;
    [EntryType.CONDITION]: IStatusData ;
    [EntryType.DEPLOYABLE]: IDeployableData ;
    [EntryType.QUIRK]: IQuirkData;
    [EntryType.PILOT]: IPilotData;
}

// We use this mapping to map Entry items to raw data types
type LiveSuper = {[key in EntryType]: VRegistryItem<any>};
interface LiveTypeMapping extends LiveSuper {
    [EntryType.CORE_BONUS]: CoreBonus;
    [EntryType.FACTION]: Faction;
    [EntryType.FRAME]: Frame;
    [EntryType.MANUFACTURER]: Manufacturer;
    [EntryType.NPC_CLASS]: NpcClass;
    [EntryType.NPC_TEMPLATE]: NpcTemplate;
    [EntryType.NPC_FEATURE]: NpcFeature;
    [EntryType.WEAPON_MOD]: WeaponMod;
    [EntryType.MECH_WEAPON]: MechWeapon;
    [EntryType.MECH_SYSTEM]: MechSystem;
    [EntryType.TALENT]: Talent;
    [EntryType.SKILL]: Skill ;
    [EntryType.RESERVE]: Reserve ;
    [EntryType.ENVIRONMENT]: Environment ;
    [EntryType.SITREP]: Sitrep ;
    [EntryType.TAG]: TagTemplate ;
    // [EntryType.LICENSE]: License ;
    [EntryType.PILOT_GEAR]: PilotGear ;
    [EntryType.PILOT_ARMOR]: PilotArmor ;
    [EntryType.PILOT_WEAPON]: PilotWeapon ;
    [EntryType.PILOT_EQUIPMENT]: PilotEquipment ;
    [EntryType.STATUS]: Status ;
    [EntryType.CONDITION]: Status ;
    [EntryType.DEPLOYABLE]: Deployable ;
    [EntryType.QUIRK]: Quirk ;
    [EntryType.PILOT]: Pilot ;
}

// This is how data is stored/retrieved throughout the application. Depending on context (web, static, etc) might have different storage and retreival mechanisms)
export type CreationFunc<T extends EntryType> = (r: RawTypeMapping[T], c: Registry) => Promise<LiveTypeMapping[T]>;

export abstract class RegCat<T extends EntryType> {
    // Need this to key them because we can't really identify otherwise
    cat: T;

    // Creation func needed to create live entries
    creation_func: CreationFunc<T>;

    // Need this for like, basically everything
    parent: Registry;

    constructor(parent: Registry, cat: T, creator: CreationFunc<T>) {
        this.parent = parent;
        this.cat = cat;
        this.creation_func = creator;
    }

    // Fetches the specific raw item of a category by its ID
    abstract async get_raw(id: string): Promise<RawTypeMapping[T] | null>;

    // Fetches all raw items of a category
    abstract async list_raw(): Promise<Array<RawTypeMapping[T]>>;

    // Instantiates a live interface of the specific raw item. 
    abstract async get_live(id: string): Promise<RegistryHandle<T> | null>;

    // Instantiates live interfaces of the specified category. Slightly expensive
    abstract async list_live(): Promise<Array<RegistryHandle<T>>>;

    // Save the given live item, propagating any changes made to it to the backend data source
    // Should NOT accept new items, as we don't know that they will play nice with 
    abstract async update(...vals: Array<RegistryHandle<T>>): Promise<void>;

    // Delete the given id in the given category. Return deleted item, or null if not found
    // reason for returning live is for if you want to do any post-mortem actions, such as display a helpful message, and don't want to parse
    abstract async delete_id(id: string): Promise<RegistryHandle<T> | null>;

    // Call this only if the registry categories aren't polling from some external source
    // Returns them with handles
    abstract async create(...vals: Array<LiveTypeMapping[T]>): Promise<RegistryHandle<T>[]>;
}

export class Registry {
    handlers: Map<EntryType, RegCat<any>>; // We cannot definitively type this here, unfortunately

    // Puts a single value. Gives back the put item's ID
    async create(val: VRegistryItem<any>): Promise<string>  {
        let cat = this.get_cat(val.Type);
        return (await cat.create(val))[0];
    }

    // Call this only if the registry categories aren't polling from some external source
    async create_many(...vals: VRegistryItem<any>[]): Promise<void>  {
        // As a courtesy / optimization measure, we categorize these first, then send in batches
        let groupings = new Map<EntryType, Array<VRegistryItem<any>>>();
        for(let v of vals) {
            if(groupings.has(v.Type)) {
                groupings.get(v.Type)!.push(v);
            } else {
                groupings.set(v.Type, [v]);
            }
        }

        // Dispatch groups
        for(let [k,v] of groupings.entries()) {
            this.get_cat(k).create(...v);
        }
    }

    // Delete an item, by cat + id
    async delete(cat: EntryType, id: string) {
        this.get_cat(cat).delete_id(id);
    }

    // Trivial, but can be overridden to have more advanced behaviors
    constructor(){
        this.handlers = new Map();
    }

    // Adds a category. Do this before performing other operations. Make sure you get them all! ;)
    add_cat<T extends EntryType>(cat: RegCat<T>) {
        this.handlers.set(cat.cat, cat);
    }

    // Fetch the specified category or error if it doesn't exist
    get_cat<T extends EntryType>(cat: T):  RegCat<T> {
        let v = this.handlers.get(cat);
        if(!v) {
            throw new Error(`Error: Category "${cat}" not setup`);
        }
        return v;
    }

    // Get by ID from _anywhere_. This is pretty funky/unreliable/slow, depending on implementation, because it just polls all categories
    // You should be able to figure out the type from the `Type` of the VRegistryItem
    async get_from_anywhere(id: string): Promise<VRegistryItem<any> | null> {
        for(let [k, c] of this.handlers) {
            let v = await c.get_live(k);
            if(v) {
               return v;
            }
        }
        return null;
    }
}


// Ref implementation
// Contains all lookupable items
export class StaticRegistryCat<T extends EntryType> extends RegCat<T> {
    // Just store our data as a k/v lookup
    data: Map<string, RawTypeMapping[T]> = new Map();

    async get_raw(id: string): Promise<RawTypeMapping[T] | null> {
        return this.data.get(id) || null;
    }
    async list_raw(): Promise<RawTypeMapping[T][]> {
        return Array.from(this.data.values());
    }
    get_live(id: string): Promise<LiveTypeMapping[T] | null> {
        throw new Error('Method not implemented.');
    }
    list_live(): Promise<LiveTypeMapping[T][]> {
        throw new Error('Method not implemented.');
    }
    update(...vals: LiveTypeMapping[T][]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // Pretty simple
    async delete_id(id: string): Promise<RawTypeMapping[T] | null> {
        let r = this.data.get(id);
        this.data.delete(id);
        return r || null;
    }

    // Create new entries in our data map
    async create(...vals: LiveTypeMapping[T][]): Promise<string[]> {
        let new_keys: string[] = [];
        for(let v of vals) {
            let vt = v as VRegistryItem;
            if(vt.Type !== this.cat) {
                throw new Error(`Attempted to put ${vt.Type} into the ${this.cat} category of the store`);
            }

            // We just use their compendium IDs, doing a really dumb collision avoidance routine
            let base_id = vt.ID;
            if(base_id == ID_ANONYMOUS) {
                base_id = "anonymous_item";
            }
            let reg_id = base_id;
            let ctr = 1;
            while(this.data.has(reg_id)) {
                reg_id = `${base_id}_${ctr}`;
            }

            this.data.set(reg_id, vt.Serialize());
            new_keys.push(reg_id);
        }
        return new_keys;
    }

}
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

/*
export class CompendiumStore extends AbsStoreModule {
    // Pack management - note that we break here from the compcon way of doing it, and do not automatically save content after changes, to be more consistent with other platforms
    public _content_packs: ContentPack[] = []; // Currently loaded custom content packs.

    // Should we always include the core data?
    private _include_core: boolean = true;

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
        for (let l of comp[EntryType.LICENSE]) {
            l.updateUnlocks();
        }
    }

    public compendium: Compendium = new Compendium();

    // This variant panics on null
    public instantiate<T extends CompendiumCategory>(EntryType: T, id: string): ICompendium[T][0] {
        let v = this.instantiateCareful(EntryType, id);
        if (!v) {
            throw new TypeError(`Could not create item ${id} of category ${EntryType}`);
        }
        return v;
    }

    // Instantiate an item from a collection
    // Note that functionally, this is just getReferenceByID except it also clones
    public instantiateCareful<T extends CompendiumCategory>(
        EntryType: T,
        id: string
    ): Compendium[T][0] | null {
        let v = this.getReferenceByIDCareful(EntryType, id);
        if (!v) {
            return v;
        } else {
            return lodash.cloneDeep(v);
        }
    }


    // Get a specific item from an item collection
    // public getReferenceByID<T>(EntryType: LookupType, id: string): T | { err: string } { // Can we make this generic work?
    public getReferenceByIDCareful<T extends CompendiumCategory>(
        EntryType: T,
        id: string
    ): ICompendium[T][0] | null {
        const items = this.getItemCollection(EntryType);

        // Typescript cannot consolidate predicates, so we treat as any.
        const i = (items as Array<any>).find(x => x.ID === id || x.id === id);
        return i || null;
    }

    // Panic on null
    public getReferenceByID<T extends CompendiumCategory>(
        EntryType: T,
        id: string
    ): ICompendium[T][0] {
        let v = this.getReferenceByIDCareful(EntryType, id);
        if (!v) {
            throw new TypeError(`Invalid item ${id} of category ${EntryType}`);
        }
        return v;
    }

    // Get the item collection of the provided type
    public getItemCollection<T extends CompendiumCategory>(EntryType: T): ICompendium[T] {
        return this.compendium[EntryType];
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
}

*/