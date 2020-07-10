import lodash from "lodash";
import lancerData from "lancer-data";
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
import { ICoreBonusData } from "@/classes/pilot/CoreBonus";
import { ItemType } from "@/classes/enums";
import { PilotEquipment } from "@/classes/pilot/PilotEquipment";

const CONTENT_PACKS = "ContentPacks";
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

// Contains the core compendium data
class Compendium {
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
export const PackKeys: Array<CompendiumCategory> = [
    CORE_BONUSES,
    FACTIONS,
    FRAMES,
    // LICENSES,
    MANUFACTURERS,
    NPC_CLASSES,
    NPC_TEMPLATES,
    NPC_FEATURES,
    WEAPON_MODS,
    MECH_WEAPONS,
    // MECH_SYSTEM,
    PILOT_GEAR,
    // PILOT_ARMOR,
    TALENTS,
    // SKILLS,
    // STATUSES,
    // RESERVES,
    // ENVIRONMENTS,
    // SITREPS,
    // PILOT_WEAPONS,
    TAGS,
    // QUIRKS
];

// This is all compendium keys, IE items that  you can lookup by collection (and sometimes ID)
export const CompendiumKeys: CompendiumCategory[] = Object.keys(new Compendium()) as any;

// So we don't have to treat it separately
const BASE_ID = "LANCER_CORE_DATA";
export function getBaseContentPack(): ContentPack {
    // lancerData.
    return new ContentPack({
        active: true,
        id: BASE_ID,
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
        },
    });
}

export abstract class CompendiumStore {
    // Pack management - note that we break here from the compcon way of doing it, and do not automatically save content after changes, to be more consistent with other platforms
    public [CONTENT_PACKS]: ContentPack[] = []; // Currently loaded custom content packs.

    public abstract async loadContentPacks(): Promise<void>; // Load the contact packs themselves from static storage
    public abstract async saveContentPacks(): Promise<void>; // Save the content packs to static storage

    // Delete the specified pack from loaded state
    // Automatically reloads data
    public deleteContentPack(packID: string): void {
        let i = this[CONTENT_PACKS].findIndex(p => p.ID == packID);
        if (i !== -1) {
            this[CONTENT_PACKS].splice(i, 1);
        }
        this.loadCompendium();
    }

    // Add the given pack to loaded state. Replaces existing packs with given id
    // Automatically reloads data
    public addContentPack(pack: ContentPack): void {
        // Get existing index if any
        let i = this[CONTENT_PACKS].findIndex(p => p.ID == pack.ID);

        // If present, replace
        if (i !== -1) {
            let [replaced] = this[CONTENT_PACKS].splice(i, 1, pack);
            logger(
                `Replacing pack ${replaced.Name}:${replaced.Version} with ${pack.Name}:${pack.Version}`
            );
        } else {
            // Otherwise just push
            this[CONTENT_PACKS].push(pack);
        }
        this.loadCompendium();
    }

    // Flag a pack as active in the loaded state. Automatically reloads pack data
    public setPackActive(packID: string, active: boolean): void {
        // Set the specified pack as active
        let pack = this[CONTENT_PACKS].find(p => p.ID === packID);
        if (pack) {
            pack.SetActive(active);
        }
        this.loadCompendium();
    }

    // We can implement this mgmt functions here, regardless of anything else
    public packAlreadyInstalled(packID: string): boolean {
        return !!this[CONTENT_PACKS].find(p => p.ID == packID);
    }

    // Amends the custom content packs with the base
    private get getAllContentPacks(): ContentPack[] {
        return [getBaseContentPack(), ...this[CONTENT_PACKS]];
    }

    // (Re)loads the base lancer data, as well as any additional content packs data, from currently loaded packs/core data
    // We'll want to call this after any pack changes, to ensure data is properly updated.
    public loadCompendium(): void {
        // Get a fresh compendium
        let comp = new Compendium();

        // Load data from pack
        for (let pack of this.getAllContentPacks.filter(p => p.Active)) {
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
    }

    public compendium: Compendium = new Compendium();

    // Instantiate an item from a collection
    // Note that functionally, this is just getReferenceByID except if you want to change it afterwards (e.g. an NPC)
    public instantiate<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): ICompendium[T][0] | null {
        return lodash.cloneDeep(this.getReferenceByID(itemType, id));
    }

    // Get a specific item from an item collection
    // public getReferenceByID<T>(itemType: LookupType, id: string): T | { err: string } { // Can we make this generic work?
    public getReferenceByID<T extends CompendiumCategory>(
        itemType: T,
        id: string
    ): ICompendium[T][0] | null {
        const items = this.getItemCollection(itemType);
        // Typescript cannot consolidate predicates, so we treat as any.
        const i = (items as Array<any>).find(x => x.ID === id || x.id === id);
        return i || null;
    }

    // Get the item collection of the provided type
    public getItemCollection<T extends CompendiumCategory>(itemType: T): ICompendium[T] {
        return this.compendium[itemType];
    }
}
