// Maintain this file as the single point of import for all interface definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored

// first in this file.
export { IActionData } from "@/classes/Action";
export { IBackground } from "@/classes/Background";
export {IBonusData} from "@/classes/Bonus";
export { IContentPackManifest, IContentPack, IContentPackData } from "./classes/ContentPack";
export { PackedCounterData, PackedCounterSaveData, RegCounterData } from "./classes/Counter";
export { PackedCoreBonusData, RegCoreBonusData } from "./classes/pilot/CoreBonus";

export { ISynergyData } from "@/classes/Synergy";
export { ILicensedItemData } from "./classes/LicensedItem";
export { PackedCoreSystemData, RegCoreSystemData } from "./classes/mech/CoreSystem";
export { PackedDeployableData, RegDeployableData } from "./classes/Deployable";
export { IFrameData, IFrameStats } from "./classes/mech/Frame";
export { PackedFrameTraitData, RegFrameTraitData } from "./classes/mech/FrameTrait";
export { PackedDamageData, RegDamageData } from "./classes/Damage";
export { IRangeData } from "./classes/Range";
export { PackedMechData, RegMechData } from "./classes/mech/Mech";
export { PackedMechSystemData, RegMechSystemData } from "./classes/mech/MechSystem";
export { PackedMechWeaponData, RegMechWeaponData } from "./classes/mech/MechWeapon";
export { RegWeaponModData, PackedWeaponModData } from "./classes/mech/WeaponMod";
export { PackedPilotData, RegPilotData } from "./classes/pilot/Pilot";
export {PackedPilotArmorData, PackedPilotEquipmentData, PackedPilotGearData, PackedPilotWeaponData, RegPilotArmorData, RegPilotGearData, RegPilotWeaponData, RegPilotEquipmentData} from "./classes/pilot/PilotEquipment";
export { IPilotLoadoutData } from "./classes/pilot/PilotLoadout";
export { IFactionData } from "./classes/Faction";
export { PackedReserveData, RegReserveData  } from "./classes/pilot/reserves/Reserve";
export { IOrganizationData } from "./classes/pilot/reserves/Organization";
export { IProjectData } from "./classes/pilot/reserves/Project";
export {PackedTalentData, PackedTalentRank, RegTalentRank, TalentRank, RegTalentData, ITalentItemData} from "./classes/pilot/Talent";
export {PackedSkillData, RegSkillData} from "./classes/pilot/Skill";
// export { INpcFeatureData } from "./classes/npc/NpcFeature";
// export { INpcReactionData } from "./classes/npc/NpcReaction";
// export { INpcSystemData } from "./classes/npc/NpcSystem";
// export { INpcTechData } from "./classes/npc/NpcTech";
// export { INpcItemSaveData } from "./classes/npc/NpcItem";
// export { INpcDamageData, INpcWeaponData } from "./classes/npc/NpcWeapon";
// export { INpcStats } from "./classes/npc/NpcStats";
// export { INpcClassData } from "./classes/npc/NpcClass";
// export { INpcTemplateData } from "./classes/npc/NpcTemplate";
// export { INpcData } from "./classes/npc/Npc";
export { IEncounterData } from "./classes/encounter/Encounter";
export { IMissionData } from "./classes/encounter/Mission";
export { IMissionStep } from "./classes/encounter/IMissionStep";
export { VActor } from "./classes/encounter/Actor";
export { PackedQuirkData, RegQuirkData } from "./classes/pilot/Quirk";
export { IActiveMissionData } from "./classes/encounter/ActiveMission";
export { IStatusData } from "./classes/Statuses";
export { ISitrepData } from "./classes/encounter/Sitrep";
export { IEnvironmentData } from "./classes/encounter/Environment";
export { PackedTagInstanceData, RegTagInstanceData, ITagTemplateData } from "./classes/Tag";
export { IManufacturerData} from "./classes/Manufacturer";
// export { DataStoreOptions } from "./store/store_module";
export * from "./classes/GeneralInterfaces";
