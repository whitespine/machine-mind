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
    NpcClass,
    NpcTemplate,
    NpcFeature,
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
    PackedCoreBonusData,
    PackedTalentData,
    PackedPilotEquipmentData,
    PackedWeaponModData,
    PackedMechSystemData,
    PackedMechWeaponData,
    PackedFrameData,
    PackedReserveData,
    PackedSkillData,
    PackedManufacturerData,
    PackedNpcClassData,
    AnyPackedNpcFeatureData,
    PackedNpcTemplateData,
    PackedSitrepData,
    PackedEnvironmentData,
    PackedStatusData,
    PackedTagTemplateData,
    PackedFactionData,
} from "@src/interface";
import { EntryType, LiveEntryTypes, OpCtx, PackedEntryTypes, RegEntry, RegEntryTypes, Registry } from "@src/registry";
import { RegEnv, StaticReg } from "@src/static_registry";
import { LicensedItem } from "./License";
import { PackedPilotArmorData, PackedPilotGearData, PackedPilotWeaponData } from "./pilot/PilotEquipment";

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
    manufacturers: PackedManufacturerData[];
    factions: PackedFactionData[];
    coreBonuses: PackedCoreBonusData[];
    frames: PackedFrameData[];
    weapons: PackedMechWeaponData[];
    systems: PackedMechSystemData[];
    mods: PackedWeaponModData[];
    pilotGear: PackedPilotEquipmentData[];
    talents: PackedTalentData[];
    tags: PackedTagTemplateData[];

    npcClasses: PackedNpcClassData[];
    npcFeatures: AnyPackedNpcFeatureData[];
    npcTemplates: PackedNpcTemplateData[];

    // New additions courtesy of whitespine
    skills?: PackedSkillData[];
    statuses?: PackedStatusData[];
    reserves?: PackedReserveData[];
    environments?: PackedEnvironmentData[];
    sitreps?: PackedSitrepData[];
    quirks?: string[];
}

export interface IContentPack {
    id: string;
    active: boolean;
    manifest: IContentPackManifest;
    data: IContentPackData;
}

// Used for filtering while intaking
type IntakeFilterFunc<T extends EntryType = EntryType> = (type: T, value: RegEntryTypes<T>) => boolean;
type Unpacker<T extends EntryType> = ((dat: PackedEntryTypes<T>, reg: Registry, ctx: OpCtx) => Promise<LiveEntryTypes<T>>);

async function intake_cat<T extends EntryType>(
    type: T,
    items: PackedEntryTypes<T>[], 
    to_registry: Registry, 
    in_ctx: OpCtx, 
    unpacker: Unpacker<T>,
    filter?: IntakeFilterFunc): Promise<LiveEntryTypes<T>[]> {

    // Let us begin. Get rid of error frames/weapons/items
    const error_predicate = (x: any) => x.name != "ERR: DATA NOT FOUND";
    items = items.filter(error_predicate);

    let tmp_filter_reg = new StaticReg(new RegEnv());
    let tmp_ctx = new OpCtx();

    // Unpack all
    let result: Promise<LiveEntryTypes<T>>[] = [];
    for (let i of items) {
        if(filter) {
            let tmp = await unpacker(i, tmp_filter_reg, tmp_ctx);
            // Don't save - use orig data. Saving/writebacking will destroy unresolved refs (for now)
            if(!filter(type, tmp.OrigData)) {
                continue;
            }
        }

        result.push(unpacker(i, to_registry, in_ctx));
    }
    return Promise.all(result);
}

export async function intake_pack(pack: IContentPack, to_registry: Registry, filter?: IntakeFilterFunc) {
    // If provided, the filter will let us decide if we should add the item. 
    // If filter returns true, then we proceed

    // A small (actually HUGE) note: These things will in all likelihood be super busted ref-wise!
    // However, their reg data will be totally fine, as the reg's will still have the unresolved refs
    // This is do to a peculiarity of our setup in that even if you load an item and its refs fail to resolve,
    // because there is no automatic writeback those unresolved refs will still exist in the registry copy
    let d = pack.data;
    let reg = to_registry;
    let ctx = new OpCtx();
    let licenseables: LicensedItem[] = [];

    const incat = <T extends EntryType>(type:T, items: PackedEntryTypes<T>[], unpacker: Unpacker<T>) => intake_cat(type, items, reg, ctx, unpacker, filter);
    await incat(EntryType.MANUFACTURER, d.manufacturers, Manufacturer.unpack);
    await incat(EntryType.FACTION, d.factions, Faction.unpack);
    await incat(EntryType.CORE_BONUS, d.coreBonuses, CoreBonus.unpack);
    licenseables = licenseables.concat(await incat(EntryType.FRAME, d.frames, Frame.unpack));
    licenseables = licenseables.concat(await incat(EntryType.MECH_WEAPON, d.weapons, MechWeapon.unpack));
    licenseables = licenseables.concat(await incat(EntryType.MECH_SYSTEM, d.systems, MechSystem.unpack));
    licenseables = licenseables.concat(await incat(EntryType.WEAPON_MOD, d.mods, WeaponMod.unpack));
    await incat(EntryType.TALENT, d.talents, Talent.unpack);
    await incat(EntryType.TAG, d.tags, TagTemplate.unpack);
    await incat(EntryType.NPC_CLASS, d.npcClasses, NpcClass.unpack);
    await incat(EntryType.NPC_TEMPLATE, d.npcTemplates, NpcTemplate.unpack);
    await incat(EntryType.NPC_FEATURE, d.npcFeatures, NpcFeature.unpack);
    await incat(EntryType.ENVIRONMENT, d.environments ?? [], Environment.unpack);
    await incat(EntryType.RESERVE, d.reserves ?? [], Reserve.unpack);
    await incat(EntryType.SITREP, d.sitreps ?? [], Sitrep.unpack);
    await incat(EntryType.SKILL, d.skills ?? [], Skill.unpack);
    await incat(EntryType.STATUS, d.statuses ?? [], Status.unpack);
    await incat(EntryType.QUIRK, d.quirks ?? [], Quirk.unpack);
    let armors = d.pilotGear.filter(x => x.type == "Armor") as PackedPilotArmorData[];
    let gears = d.pilotGear.filter(x => x.type == "Gear") as PackedPilotGearData[];
    let weapons = d.pilotGear.filter(x => x.type == "Weapon") as PackedPilotWeaponData[];
    await incat(EntryType.PILOT_ARMOR, armors, PilotArmor.unpack);
    await incat(EntryType.PILOT_GEAR, gears, PilotGear.unpack);
    await incat(EntryType.PILOT_WEAPON, weapons, PilotWeapon.unpack);

    // Find licenses
    let unique_license_names: Map<string, Manufacturer | null> = new Map();
    let man_cat = reg.get_cat(EntryType.MANUFACTURER);
    for (let x of licenseables) {
        if (x.License) {
            // Lookup the source. Brittle but workable
            let src_lid = x.OrigData.source.fallback_lid;
            if(src_lid) {
                let manufacturer = await man_cat.lookup_lid_live(ctx, src_lid);
                unique_license_names.set(x.License, manufacturer);
            }
        }
    }

    // Actually create them
    for (let name of unique_license_names.keys()) {
        await License.unpack(name, reg, ctx, unique_license_names.get(name)!);
    }
}
