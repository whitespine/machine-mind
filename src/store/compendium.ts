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
    // Pack management - note that we break here from the compcon way of doing it, and do not automatically save content after add/save/enable
    public abstract async loadContentPacks(): Promise<void>; // Load the contact packs themselves from static storage
    public abstract deleteContentPack(packID: string): void;
    public abstract addContentPack(pack: ContentPack): void;
    public abstract setPackActive(packID: string, active: boolean): void;
    public abstract get getCustomContentPacks(): ContentPack[]; // Get currently loaded custom content packs.
    public abstract async saveContentPacks(): Promise<void>; // Save the content packs to static storage

    // We can implement this mgmt functions here, regardless of anything else
    public packAlreadyInstalled(packID: string): boolean {
        return this.getCustomContentPacks.map(pack => pack.ID).includes(packID);
    }

    // Amends the custom content packs with the base
    public get getAllContentPacks(): ContentPack[] {
        return [getBaseContentPack(), ...this.getCustomContentPacks];
    }

    // Loads the base lancer data, as well as any additional data, from
    // We'll want to call this after any pack changes, to ensure data is properly updated.
    // Vue use case won't really need to do anything here, but could be useful for other, less reactive systems
    public abstract loadPackData(): void;

    // Instantiate an item from a collection
    // Note that functionally, this is just getReferenceByID except if you want to change it afterwards
    public abstract instantiate(itemType: string, id: string): any | { err: string };

    // Get a specific item from an item collection
    public abstract getReferenceByID(itemType: string, id: string): any | { err: string };

    // Get the item collection of the provided type
    public abstract getItemCollection<T>(type: string): Array<T>;

    // Get assorted item/attributes
    public abstract get CoreBonuses(): CoreBonus[];
    public abstract get Factions(): Faction[];
    public abstract get Frames(): Frame[];
    public abstract get Licenses(): License[];
    public abstract get Manufacturers(): Manufacturer[];
    public abstract get NpcClasses(): NpcClass[];
    public abstract get NpcTemplates(): NpcTemplate[];
    public abstract get NpcFeatures(): NpcFeature[];
    public abstract get WeaponMods(): WeaponMod[];
    public abstract get MechWeapons(): MechWeapon[];
    public abstract get MechSystem(): MechSystem[];
    public abstract get PilotGear(): PilotGear[];
    public abstract get PilotArmor(): PilotArmor[];
    public abstract get Talents(): Talent;
    public abstract get Skills(): Skill[];
    public abstract get Statuses(): Status[];
    public abstract get Quirks(): string[];
    public abstract get Reserves(): Reserve[];
    public abstract get Environments(): Environment[];
    public abstract get Sitreps(): Sitrep[];
    public abstract get PilotWeapons(): PilotWeapon[];
    public abstract get Tags(): Tag[];

    // Get the current user profile -- this is really more of a compcon _app_ thing, and is thus omitted herein
    // abstract getUserProfile(): UserProfile;

    // Get the current version
    abstract get getVersion(): string;

    // Set the current version to display
    abstract setVersions(lancerVer: string, ccVer: string): void;
}
// private nfErr = { err: 'ID not found' }
