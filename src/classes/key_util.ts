import {
    CoreBonus,
    CoreSystem,
    Deployable,
    Environment,
    Faction,
    Frame,
    FrameTrait,
    License,
    Manufacturer,
    Mech,
    MechSystem,
    MechWeapon,
    Npc,
    NpcClass,
    NpcFeature,
    NpcTemplate,
    Organization,
    Pilot,
    PilotArmor,
    PilotGear,
    PilotWeapon,
    Quirk,
    Reserve,
    Sitrep,
    Skill,
    Status,
    TagTemplate,
    Talent,
    WeaponMod,
} from "@src/class";
import {
    IEnvironmentData,
    IFactionData,
    IOrganizationData,
    ISitrepData,
    IStatusData,
    ITagTemplateData,
    RegCoreBonusData,
    RegCoreSystemData,
    RegDeployableData,
    RegFrameData,
    RegFrameTraitData,
    RegLicenseData,
    RegManufacturerData,
    RegMechData,
    RegMechSystemData,
    RegMechWeaponData,
    RegNpcClassData,
    RegNpcData,
    RegNpcFeatureData,
    RegNpcTemplateData,
    RegPilotArmorData,
    RegPilotData,
    RegPilotGearData,
    RegPilotWeaponData,
    RegQuirkData,
    RegReserveData,
    RegSkillData,
    RegTalentData,
    RegWeaponModData,
} from "@src/interface";
import { EntryType, RegEntry, RegEntryTypes } from "@src/registry";
import { keys } from "ts-transformer-keys";

// Expected keys for live types
let pending_live_keyset: any = null;
function live_keyset_map(): any {
    if (!pending_live_keyset) {
        pending_live_keyset = {
            [EntryType.CORE_BONUS]: keys<CoreBonus>(),
            [EntryType.DEPLOYABLE]: keys<Deployable>(),
            [EntryType.ENVIRONMENT]: keys<Environment>(),
            [EntryType.FACTION]: keys<Faction>(),
            [EntryType.FRAME]: keys<Frame>(),
            [EntryType.LICENSE]: keys<License>(),
            [EntryType.MANUFACTURER]: keys<Manufacturer>(),
            [EntryType.WEAPON_MOD]: keys<WeaponMod>(),
            [EntryType.MECH]: keys<Mech>(),
            [EntryType.MECH_SYSTEM]: keys<MechSystem>(),
            [EntryType.MECH_WEAPON]: keys<MechWeapon>(),
            [EntryType.NPC]: keys<Npc>(),
            [EntryType.NPC_CLASS]: keys<NpcClass>(),
            [EntryType.NPC_FEATURE]: keys<NpcFeature>(),
            [EntryType.NPC_TEMPLATE]: keys<NpcTemplate>(),
            [EntryType.ORGANIZATION]: keys<Organization>(),
            [EntryType.PILOT_ARMOR]: keys<PilotArmor>(),
            [EntryType.PILOT_GEAR]: keys<PilotGear>(),
            [EntryType.PILOT_WEAPON]: keys<PilotWeapon>(),
            [EntryType.PILOT]: keys<Pilot>(),
            [EntryType.RESERVE]: keys<Reserve>(),
            [EntryType.SITREP]: keys<Sitrep>(),
            [EntryType.SKILL]: keys<Skill>(),
            [EntryType.STATUS]: keys<Status>(),
            [EntryType.TAG]: keys<TagTemplate>(),
            [EntryType.TALENT]: keys<Talent>(),
            [EntryType.QUIRK]: keys<Quirk>(),
        };
    }
    return pending_live_keyset;
}

// Expected keys for registry types
let pending_reg_keyset: any = null;
function reg_keyset_map(): any {
    if (!pending_reg_keyset) {
        pending_reg_keyset = {
            [EntryType.CORE_BONUS]: keys<RegCoreBonusData>(),
            [EntryType.DEPLOYABLE]: keys<RegDeployableData>(),
            [EntryType.ENVIRONMENT]: keys<IEnvironmentData>(),
            [EntryType.FACTION]: keys<IFactionData>(),
            [EntryType.FRAME]: keys<RegFrameData>(),
            [EntryType.LICENSE]: keys<RegLicenseData>(),
            [EntryType.MANUFACTURER]: keys<RegManufacturerData>(),
            [EntryType.WEAPON_MOD]: keys<RegWeaponModData>(),
            [EntryType.MECH]: keys<RegMechData>(),
            [EntryType.MECH_SYSTEM]: keys<RegMechSystemData>(),
            [EntryType.MECH_WEAPON]: keys<RegMechWeaponData>(),
            [EntryType.NPC]: keys<RegNpcData>(),
            [EntryType.NPC_CLASS]: keys<RegNpcClassData>(),
            [EntryType.NPC_FEATURE]: keys<RegNpcFeatureData>(),
            [EntryType.NPC_TEMPLATE]: keys<RegNpcTemplateData>(),
            [EntryType.ORGANIZATION]: keys<IOrganizationData>(),
            [EntryType.PILOT_ARMOR]: keys<RegPilotArmorData>(),
            [EntryType.PILOT_GEAR]: keys<RegPilotGearData>(),
            [EntryType.PILOT_WEAPON]: keys<RegPilotWeaponData>(),
            [EntryType.PILOT]: keys<RegPilotData>(),
            [EntryType.RESERVE]: keys<RegReserveData>(),
            [EntryType.SITREP]: keys<ISitrepData>(),
            [EntryType.SKILL]: keys<RegSkillData>(),
            [EntryType.STATUS]: keys<IStatusData>(),
            [EntryType.TAG]: keys<ITagTemplateData>(),
            [EntryType.TALENT]: keys<RegTalentData>(),
            [EntryType.QUIRK]: keys<RegQuirkData>(),
        };
    }
    return pending_reg_keyset;
}

// Checks that all expected keys are present on a reg entry
export function validate_props(v: RegEntry<any>) {
    let entry = v.Type;
    let expected_keys = live_keyset_map()[entry];
    if (!expected_keys) {
        throw new Error(`Error! ${entry} keys not found`);
    }
    for (let key of live_keyset_map()[entry]) {
        if (v[key] === undefined) {
            let ks = live_keyset_map[entry];
            throw new Error(`Error! ${entry} missing key ${key}`);
        }
    }
}

// Trims out all unneeded keys from a regdata. Use for unpacking to get rid of junk left over by ...'ing the o.g. data
export function trimmed<T extends EntryType>(type: T, v: RegEntryTypes<T>): RegEntryTypes<T> {
    // Perform this op by re-adding only the keys we want to keep
    let result: any = {};
    let expected_keys = reg_keyset_map()[type];
    if (!expected_keys) {
        throw new Error(`Error! '${type}' keys not found`);
    }
    for (let k of expected_keys) {
        result[k] = v[k];
    }
    return result;
}
