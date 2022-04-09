// Maintain this file as the single point of import for all interface definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored

// first in this file.
export { PackedActionData, RegActionData } from "@src/classes/components/Action";
export { PackedBackground, RegBackground } from "@src/classes/pilot/Background";
export { PackedBonusData, RegBonusData, BonusSummary, BonusContext } from "@src/classes/components/Bonus";
export { IContentPackManifest, IContentPack, IContentPackData } from "./classes/utility/ContentPack";
export {
    PackedCounterData,
    PackedCounterSaveData,
    RegCounterData,
    SourcedCounter,
} from "./classes/components/Counter";
export { PackedCoreBonusData, RegCoreBonusData } from "./classes/pilot/CoreBonus";

export { ISynergyData, SynergyLocation } from "@src/classes/components/Synergy";
export { LicensedItem, LicensedItemType, RegLicenseData } from "./classes/utility/License";
export { PackedCoreSystemData, RegCoreSystemData } from "./classes/mech/CoreSystem";
export { PackedDeployableData, RegDeployableData } from "./classes/mech/Deployable";
export { PackedFrameData, RegFrameData, IFrameStats } from "./classes/mech/Frame";
export { PackedFrameTraitData, RegFrameTraitData } from "./classes/mech/FrameTrait";
export { PackedDamageData, RegDamageData, DamageTypeChecklist } from "./classes/components/Damage";
export { PackedRangeData, RegRangeData, RangeTypeChecklist } from "./classes/components/Range";
export { PackedMechData, RegMechData } from "./classes/mech/Mech";
export { PackedMechSystemData, RegMechSystemData } from "./classes/mech/MechSystem";
export {
    PackedMechWeaponData,
    RegMechWeaponData,
    RegMechWeaponProfile,
    PackedMechWeaponProfile,
    WeaponSizeChecklist,
    WeaponTypeChecklist,
} from "./classes/mech/MechWeapon";
export {
    PackedMechLoadoutData,
    PackedEquipmentData,
    PackedMechWeaponSaveData,
    PackedMountData,
    PackedWeaponSlotData,
    RegMechLoadoutData,
    RegSysMountData,
    RegWepMountData,
} from "./classes/mech/MechLoadout";
export { RegWeaponModData, PackedWeaponModData } from "./classes/mech/WeaponMod";
export { PackedPilotData, RegPilotData } from "./classes/pilot/Pilot";
export {
    PackedPilotArmorData,
    PackedPilotEquipmentData,
    PackedPilotGearData,
    PackedPilotWeaponData,
    RegPilotArmorData,
    RegPilotGearData,
    RegPilotWeaponData,
    RegPilotEquipmentData,
} from "./classes/pilot/PilotEquipment";
export {
    PackedPilotEquipmentState,
    PackedPilotLoadoutData,
    RegPilotLoadoutData,
} from "./classes/pilot/PilotLoadout";
export { PackedFactionData, RegFactionData } from "./classes/utility/Faction";
export { PackedReserveData, RegReserveData } from "./classes/pilot/reserves/Reserve";
export { PackedOrganizationData, RegOrganizationData } from "./classes/pilot/reserves/Organization";
// export { IProjectData } from "./classes/pilot/reserves/Project";
export {
    PackedTalentData,
    PackedTalentRank,
    RegTalentRank,
    TalentRank,
    RegTalentData,
    ITalentItemData,
} from "./classes/pilot/Talent";
export { PackedSkillData, RegSkillData } from "./classes/pilot/Skill";
export {
    IOriginData,
    PackedNpcReactionData,
    PackedNpcWeaponData,
    PackedNpcSystemData,
    PackedNpcTraitData,
    PackedNpcTechData,
    NpcFeature,
    AnyPackedNpcFeatureData,
    AnyRegNpcFeatureData,
    PackedNpcDamageData,
    BaseRegNpcFeatureData,
    RegNpcReactionData,
    RegNpcSystemData,
    RegNpcTechData,
    RegNpcTraitData,
    RegNpcWeaponData,
} from "./classes/npc/NpcFeature";
export { RegNpcData, PackedNpcData } from "./classes/npc/Npc";
export { RegNpcTemplateData, PackedNpcTemplateData } from "./classes/npc/NpcTemplate";
export { RegNpcClassData, PackedNpcClassData } from "./classes/npc/NpcClass";
export { INpcClassStats } from "./classes/npc/NpcClassStats";
export { INpcStats, INpcStatComposite } from "./classes/npc/NpcStats";
export { RegQuirkData } from "./classes/pilot/Quirk";
export { PackedStatusData, RegStatusData } from "./classes/mech/Statuses";
export { PackedSitrepData, RegSitrepData } from "./classes/encounter/Sitrep";
export { PackedEnvironmentData, RegEnvironmentData } from "./classes/encounter/Environment";
export {
    PackedTagInstanceData,
    RegTagInstanceData,
    PackedTagTemplateData,
    RegTagTemplateData,
} from "./classes/components/Tag";
export { RegManufacturerData, PackedManufacturerData } from "./classes/utility/Manufacturer";
export * from "./classes/GeneralInterfaces";
