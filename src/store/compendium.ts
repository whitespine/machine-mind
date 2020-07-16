import lodash from "lodash";
import * as lancerData from "@/typed_lancerdata";
// import { getUser, UserProfile } from '@/io/User'
import {
    Sitrep,
    Skill,
    Status,
    Reserve,
    Environment,
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
} from "@/class";
import { logger } from "@/hooks";
import { PilotEquipment } from "@/classes/pilot/PilotEquipment";
import { CORE_BREW_ID } from "@/classes/CompendiumItem";
import { IContentPack } from "@/classes/ContentPack";
import { AbsStoreModule } from "./store_module";

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
const STATUSES = "Statuses";
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
    [STATUSES]: Status[] = [];
    [RESERVES]: Reserve[] = [];
    [ENVIRONMENTS]: Environment[] = [];
    [SITREPS]: Sitrep[] = [];
    [TAGS]: Tag[] = [];
    [LICENSES]: License[] = []; // Come from frames
    [PILOT_GEAR]: PilotGear[] = [];
    [PILOT_ARMOR]: PilotArmor[] = []; // Come from pilot gear
    [PILOT_WEAPONS]: PilotWeapon[] = []; // Come from pilot gear
    [PILOT_EQUIPMENT]: PilotEquipment[] = []; // Come from pilot gear

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
    TALENTS,
    SKILLS,
    STATUSES,
    RESERVES,
    ENVIRONMENTS,
    SITREPS,
    PILOT_WEAPONS,
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
            item_prefix: "core",
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
    }

    // Flag a pack as active in the loaded state. Automatically reloads pack data
    public setPackActive(packID: string, active: boolean): void {
        // Set the specified pack as active
        let pack = this._content_packs.find(p => p.ID === packID);
        if (pack) {
            pack.SetActive(active);
        }
        this.populate();
    }

    // We can implement this mgmt functions here, regardless of anything else
    public packAlreadyInstalled(packID: string): boolean {
        return !!this._content_packs.find(p => p.ID == packID);
    }

    // Amends the custom content packs with the base
    private get getAll_content_packs(): ContentPack[] {
        return [getBaseContentPack(), ...this._content_packs];
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

        this.compendium = comp;
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
        let v = this.getReferenceByID(itemType, id);
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

    public async loadData(): Promise<void> {
        // Load the contact packs themselves from static storage
        let ser_packs = (await this.persistence.get_item(FILEKEY_CONTENT_PACKS)) as
            | IContentPack[]
            | null;
        if (!ser_packs) {
            this._content_packs = [];
            this.populate();
            return;
        }

        this._content_packs = ser_packs.map(cp => new ContentPack(cp));
        this.populate();
    }

    public async saveData(): Promise<void> {
        // Save the content packs to static storage
        let data_packs = this._content_packs.map(c => c.Serialize());
        await this.persistence.set_item(FILEKEY_CONTENT_PACKS, data_packs);
    }
}
