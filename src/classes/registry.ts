import * as lancerData from "@/classes/utility/typed_lancerdata";
import type {
    Skill,
    Reserve,
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
import { ContentPack } from "@/class";
import * as nanoid from "nanoid";
import { CORE_BREW_ID } from '@/classes/enums';
import { EntryType, LiveEntryTypes, RegCat, RegEntryTypes, RegSer } from '@/new_meta';


/*
Contains logic for looking up item templates by ID, or for examining lists of options
Everything herein implements VCompendiumItem
*/



// This is how data is stored/retrieved throughout the application. Depending on context (web, static, etc) might have different storage and retreival mechanisms)




// Ref implementation
// Contains all lookupable items
export class StaticRegistryCat<T extends EntryType> extends RegCat<T> {
    // Just store our data as a k/v lookup
    data: Map<string, RegEntryTypes[T]> = new Map();

    // Create a bunch o thangs
    async create_many(...vals: RegEntryTypes[T][]): Promise<LiveEntryTypes[T][]> {
        let new_items: LiveEntryTypes[T][] = [];
        for(let v of vals) {
            // Make a random id
            let id =nanoid.nanoid(); 

            // Assign it
            this.data.set(id, v);

            // Yield as a live copy
            let created = this.creation_func(this.parent, v);
        }
        return new_keys;
    }

    create_default(): Promise<LiveEntryTypes[T]> {
        throw new Error('Method not implemented.');
    }


    async get_raw(id: string): Promise<RegEntryTypes[T] | null> {
        return this.data.get(id) || null;
    }
    async list_raw(): Promise<RegEntryTypes[T][]> {
        return Array.from(this.data.values());
    }
    get_live(id: string): Promise<LiveEntryTypes[T] | null> {
        throw new Error('Method not implemented.');
    }
    list_live(): Promise<LiveEntryTypes[T][]> {
        throw new Error('Method not implemented.');
    }
    update(...vals: LiveEntryTypes[T][]): Promise<void> {
        throw new Error('Method not implemented.');
    }

    // Pretty simple
    async delete_id(id: string): Promise<RegEntryTypes[T] | null> {
        let r = this.data.get(id);
        this.data.delete(id);
        return r || null;
    }

    // Create new entries in our data map
    async create(...vals: LiveEntryTypes[T][]): Promise<string[]> {
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