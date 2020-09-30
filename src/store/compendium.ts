import lodash from "lodash";
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
    TagInstance, TagTemplate,
    License,
    Status,
    Environment,
    Sitrep, ItemType, PilotEquipment, Deployable, Quirk, Pilot
} from "@/class";
import { logger } from "@/hooks";
import { IContentPack } from "@/classes/ContentPack";
import { AbsStoreModule, load_setter_handler, DataStoreOptions } from "./store_module";
import { PersistentStore } from "@/io/persistence";
import { CORE_BREW_ID } from '@/classes/enums';
import { ICoreBonusData, IEnvironmentData, IFactionData, IFrameData, IManufacturerData, IMechSystemData, IMechWeaponData, INpcClassData, INpcFeatureData, INpcTemplateData, IPilotArmorData, IPilotEquipmentData, IPilotGearData, IPilotWeaponData, IReserveData, ISitrepData, ISkillData, ITagTemplateData, ITalentData, IWeaponModData, IRegistryItemData, IStatusData, IDeployableData, IQuirkData, IPilotData, VRegistryItem } from '@/interface';

/*
Contains logic for looking up item templates by ID, or for examining lists of options
Everything herein implements VCompendiumItem
*/

export const FILEKEY_CONTENT_PACKS = "extra_content.json";

// interface RawSuper {[key in keyof ItemType]: IRegistryItemData}; // This just makes sure the below is all as-expected
type RawSuper = {[key in ItemType]: IRegistryItemData};
interface RawTypeMapping extends RawSuper{
    [ItemType.CORE_BONUS]: ICoreBonusData;
    [ItemType.FACTION]: IFactionData;
    [ItemType.FRAME]: IFrameData;
    [ItemType.MANUFACTURER]: IManufacturerData;
    [ItemType.NPC_CLASS]: INpcClassData;
    [ItemType.NPC_TEMPLATE]: INpcTemplateData;
    [ItemType.NPC_FEATURE]: INpcFeatureData;
    [ItemType.WEAPON_MOD]: IWeaponModData;
    [ItemType.MECH_WEAPON]: IMechWeaponData;
    [ItemType.MECH_SYSTEM]: IMechSystemData;
    [ItemType.TALENT]: ITalentData;
    [ItemType.SKILL]: ISkillData ;
    [ItemType.RESERVE]: IReserveData ;
    [ItemType.ENVIRONMENT]: IEnvironmentData ;
    [ItemType.SITREP]: ISitrepData ;
    [ItemType.TAG]: ITagTemplateData ;
    // [ItemType.LICENSES]: ILicenseData ;  // As it turns out there's no reason for licenses to exist, really...
    [ItemType.PILOT_GEAR]: IPilotGearData ;
    [ItemType.PILOT_ARMOR]: IPilotArmorData ;
    [ItemType.PILOT_WEAPON]: IPilotWeaponData ;
    [ItemType.PILOT_EQUIPMENT]: IPilotEquipmentData ;
    [ItemType.STATUS]: IStatusData ;
    [ItemType.CONDITION]: IStatusData ;
    [ItemType.DEPLOYABLE]: IDeployableData ;

    [ItemType.QUIRK]: IQuirkData;

    // We now track these as well
    [ItemType.PILOT]: IPilotData;
}

type LiveSuper = {[key in ItemType]: VRegistryItem};
interface LiveTypeMapping extends LiveSuper {
    [ItemType.CORE_BONUS]: CoreBonus;
    [ItemType.FACTION]: Faction;
    [ItemType.FRAME]: Frame;
    [ItemType.MANUFACTURER]: Manufacturer;
    [ItemType.NPC_CLASS]: NpcClass;
    [ItemType.NPC_TEMPLATE]: NpcTemplate;
    [ItemType.NPC_FEATURE]: NpcFeature;
    [ItemType.WEAPON_MOD]: WeaponMod;
    [ItemType.MECH_WEAPON]: MechWeapon;
    [ItemType.MECH_SYSTEM]: MechSystem;
    [ItemType.TALENT]: Talent;
    [ItemType.SKILL]: Skill ;
    [ItemType.RESERVE]: Reserve ;
    [ItemType.ENVIRONMENT]: Environment ;
    [ItemType.SITREP]: Sitrep ;
    [ItemType.TAG]: TagTemplate ;
    [ItemType.LICENSE]: License ;
    [ItemType.PILOT_GEAR]: PilotGear ;
    [ItemType.PILOT_ARMOR]: PilotArmor ;
    [ItemType.PILOT_WEAPON]: PilotWeapon ;
    [ItemType.PILOT_EQUIPMENT]: PilotEquipment ;
    [ItemType.STATUS]: Status ;
    [ItemType.CONDITION]: Status ;
    [ItemType.DEPLOYABLE]: Deployable ;
    [ItemType.QUIRK]: Quirk ;
    [ItemType.PILOT]: Pilot ;
}

// This is how data is stored/retrieved throughout the application. Depending on context (web, static, etc) might have different storage and retreival mechanisms)
export abstract class Registry {
    // Fetches the specific raw item of a category by its ID
    abstract raw_by_id<T extends keyof RawTypeMapping>(cat: T, id: string): RawTypeMapping[T];

    // Fetches all raw items of a category
    abstract raw_list<T extends keyof RawTypeMapping>(cat: T): Array<RawTypeMapping[T]>;

    // Instantiates a live interface of the specific raw item. 
    abstract by_id<T extends keyof LiveTypeMapping>(cat: T, id: string): LiveTypeMapping[T];

    // Instantiates live interfaces of the specified category. Slightly expensive
    abstract list<T extends keyof LiveTypeMapping>(cat: T): Array<LiveTypeMapping[T]>;

    // Save the given live item, propagating any changes made to it to the backend data source
    // If this is a new item, adds it
    abstract save_item<T extends VRegistryItem>(v: T): void;

    // Delete the given id in the given category. Return deleted item, or null if not found
    abstract delete_id<T extends keyof RawTypeMapping>(cat: T, id: string): RawTypeMapping[T] | null;

    // Delete the given item. Returns success (failure indicates it was unable to find itself for deletion)
    delete_live<T extends keyof LiveTypeMapping>(v: LiveTypeMapping[T]): boolean {
        let typed_v: VRegistryItem = v;
        return this.delete_id(typed_v.Type, typed_v.ID);
    }
}

// Contains all lookupable items
export class StaticCompendium {
    [ItemType.CORE_BONUS]: CoreBonus[] = [];
    [ItemType.FACTION]: Faction[] = [];
    [ItemType.FRAME]: Frame[] = [];
    [ItemType.MANUFACTURER]: Manufacturer[] = [];
    [ItemType.NPC_CLASS]: NpcClass[] = [];
    [ItemType.NPC_TEMPLATE]: NpcTemplate[] = [];
    [ItemType.NPC_FEATURE]: NpcFeature[] = [];
    [ItemType.WEAPON_MOD]: WeaponMod[] = [];
    [ItemType.MECH_WEAPON]: MechWeapon[] = [];
    [ItemType.MECH_SYSTEM]: MechSystem[] = [];
    [ItemType.TALENT]: Talent[] = [];
    [ItemType.SKILL]: Skill[] = [];
    [ItemType.RESERVE]: Reserve[] = [];
    [ItemType.ENVIRONMENT]: Environment[] = [];
    [ItemType.SITREP]: Sitrep[] = [];
    [ItemType.TAG]: TagTemplate[] = [];
    [ItemType.LICENSE]: License[] = []; // Come from frames
    [ItemType.PILOT_GEAR]: PilotGear[] = [];
    [ItemType.PILOT_ARMOR]: PilotArmor[] = []; // Come from pilot gear
    [ItemType.PILOT_WEAPON]: PilotWeapon[] = []; // Come from pilot gear
    [ItemType.PILOT_EQUIPMENT]: PilotEquipment[] = []; // Come from pilot gear
    [ItemType.STATUS]: Status[] = []; // Come from statuses
    [ItemType.CONDITION]: Status[] = []; // Come from statuses
    [ItemType.DEPLOYABLE]: Deployable[] = []; // Comes from anything with a DEPLOYABLES sub-item, usually systems (but also some weapons like the ghast nexus)
    [ItemType.QUIRK]: string[] = []; // These are not ID'd natively. However, we've added the ability for this to provide bonuses, actions, and deployables, just for fun

    get_cat<T extends CompendiumCategory>(cat: T): ICompendium[T] & Array<VCompendiumItem> {
        return this[cat];
    }
}

export interface ICompendium extends Compendium {}

// Shorthand for valid compendium types
export type CompendiumCategory = keyof ICompendium;

// All the keys specifically in content packs. Note that some of these items are missing/ not yet able to be homebrewed
export const PackKeys = Object.keys(ItemType).map(k => ItemType[k]) as Array<keyof Compendium>;

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
        for (let l of comp[ItemType.LICENSE]) {
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
    // Note that functionally, this is just getReferenceByID except it also clones
    public instantiateCareful<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): Compendium[T][0] | null {
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
        const i = (items as Array<any>).find(x => x.ID === id || x.id === id);
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
}
