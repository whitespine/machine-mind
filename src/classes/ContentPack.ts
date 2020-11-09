import {
    Manufacturer,
    Faction,
    CoreBonus,
    MechWeapon,
    MechSystem,
    WeaponMod,
    PilotEquipment,
    PilotWeapon,
    PilotArmor,
    PilotGear,
    Talent,
    TagTemplate,
    // NpcClass,
    // NpcTemplate,
    // NpcFeature,
    // NpcWeapon,
    // NpcReaction,
    // NpcTrait,
    // NpcSystem,
    // NpcTech,
    Reserve,
    Skill,
    License,
    Environment,
    Sitrep,
    Status,
    Frame,
    Quirk,
} from "@src/class";
import {
    IManufacturerData,
    IFactionData,
    IEnvironmentData,
    ISitrepData,
    PackedCoreBonusData,
    PackedTalentData,
    PackedPilotEquipmentData,
    PackedWeaponModData,
    PackedMechSystemData,
    PackedMechWeaponData,
    PackedFrameData,
    PackedReserveData,
    ITagTemplateData,
    PackedSkillData,
} from "@src/interface";
import _ from "lodash";
import { IStatusData } from "./Statuses";
import { Registry } from "@src/registry";
import { LicensedItem } from "./License";

export interface IContentPackManifest {
    name: string;
    item_prefix: string; // Note - this is applied only on initial load. Dynamic, at runtime packs do not care about this
    author: string;
    version: string;
    description?: string;
    website?: string;
    image_url?: string;
}
export interface IContentPackData {
    manufacturers: IManufacturerData[];
    factions: IFactionData[];
    coreBonuses: PackedCoreBonusData[];
    frames: PackedFrameData[];
    weapons: PackedMechWeaponData[];
    systems: PackedMechSystemData[];
    mods: PackedWeaponModData[];
    pilotGear: PackedPilotEquipmentData[];
    talents: PackedTalentData[];
    tags: ITagTemplateData[];

    // npcClasses: INpcClassData[];
    // npcFeatures: INpcFeatureData[];
    // npcTemplates: INpcTemplateData[];

    // New additions courtesy of whitespine
    skills?: PackedSkillData[];
    statuses?: IStatusData[];
    reserves?: PackedReserveData[];
    environments?: IEnvironmentData[];
    sitreps?: ISitrepData[];
    quirks?: string[];
}

export interface IContentPack {
    id: string;
    active: boolean;
    manifest: IContentPackManifest;
    data: IContentPackData;
}

export async function intake_pack(pack: IContentPack, to_registry: Registry) {
    // Let us begin. Unpacking automatically adds the item to the registry in most cases

    // A small (actually HUGE) note: These things will in all likelihood be super busted ref-wise! 
    // However, their reg data will be totally fine, as the reg's will still have the unresolved refs
    // This is do to a peculiarity of our setup in that even if you load an item and its refs fail to resolve,
    // because there is no automatic writeback those unresolved refs will still exist in the registry copy
    let d = pack.data;
    let reg = to_registry;
    let licenseables: LicensedItem[] = [];
    for (let m of d.manufacturers) {
        Manufacturer.unpack(m, reg);
    }
    for (let f of d.factions) {
        Faction.unpack(f, reg);
    }
    for (let cb of d.coreBonuses) {
        CoreBonus.unpack(cb, reg);
    }
    for (let f of d.frames) {
        licenseables.push(await Frame.unpack(f, reg));
    }
    for (let mw of d.weapons) {
        licenseables.push(await MechWeapon.unpack(mw, reg));
    }
    for (let ms of d.systems) {
        licenseables.push(await MechSystem.unpack(ms, reg));
    }
    for (let wm of d.mods) {
        licenseables.push(await WeaponMod.unpack(wm, reg));
    }
    for (let x of d.pilotGear) {
        if (x.type == "Armor") await PilotArmor.unpack(x, reg);
        else if (x.type == "Gear") await PilotGear.unpack(x, reg);
        else if (x.type == "Weapon") await PilotWeapon.unpack(x, reg);
    }
    for (let x of d.talents) {
        await Talent.unpack(x, reg);
    }
    for (let x of d.tags) {
        await TagTemplate.unpack(x, reg);
    }
    /*
    for (let x of d.) {
        NpcClasses.unpack(x, reg);
    }
    for (let x of d.NpcTemplates) {
        NpcTemplates.unpack(x, reg);
    }
    for (let x of d.NpcFeatures) {
        NpcFeatures.unpack(x, reg);
    }
    */
    for (let x of d.environments ?? []) {
        await Environment.unpack(x, reg);
    }
    for (let x of d.reserves ?? []) {
        await Reserve.unpack(x, reg);
    }
    for (let x of d.sitreps ?? []) {
        await Sitrep.unpack(x, reg);
    }
    for (let x of d.skills ?? []) {
        await Skill.unpack(x, reg);
    }
    for (let x of d.statuses ?? []) {
        await Status.unpack(x, reg);
    }
    for (let x of d.quirks ?? []) {
        await Quirk.unpack(x, reg);
    }

    // Find licenses
    let unique_license_names: Set<string> = new Set();
    for (let x of licenseables) {
        unique_license_names.add(x.License);
    }

    // Actually create them
    for (let name of unique_license_names) {
        await License.unpack(name, reg);
    }
}
