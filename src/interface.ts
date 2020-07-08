// Maintain this file as the single point of import for all interface definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored
// first in this file.

export {
    IAIData,
    IBasicEffectData,
    IChargeData,
    IChargeEffectData,
    IDeployableData,
    IDroneData,
    IEffectData,
    IBonusEffectData,
    IProtocolEffectData,
    IReactionEffectData,
    IInvadeOptionData,
    ITechEffectData,
    IProfileEffectData,
    IOffensiveEffectData,
} from "./classes/effects/interfaces";
export { ICompendiumItemData } from "./classes/CompendiumItem";
export { ILicensedItemData } from "./classes/LicensedItem";
export { ICoreData } from "./classes/mech/CoreSystem";
export { IFrameData, IFrameStats } from "./classes/mech/Frame";
export { IMechEquipmentData } from "./classes/mech/MechEquipment";
export { IDamageData } from "./classes/Damage";
export { IRangeData } from "./classes/Range";
export { IMechSystemData } from "./classes/mech/MechSystem";
export { IWeaponModData } from "./classes/mech/WeaponMod";
export { ICoreBonusData } from "./classes/pilot/CoreBonus";
export { IPilotEquipmentData } from "./classes/pilot/PilotEquipment";
export { IPilotArmorData } from "./classes/pilot/PilotArmor";
export { IPilotWeaponData } from "./classes/pilot/PilotWeapon";
export { IPilotGearData } from "./classes/pilot/PilotGear";
export { IManufacturerData } from "./classes/Manufacturer";
export { IFactionData } from "./classes/Faction";
export { ITalentData } from "./classes/pilot/Talent";
export { ISkillData } from "./classes/pilot/Skill";
export { IMechWeaponData } from "./classes/mech/MechWeapon";
export {
    INpcFeatureData,
    INpcReactionData,
    INpcSystemData,
    INpcDamageData,
    INpcWeaponData,
    INpcStats,
    INpcClassData,
    INpcTemplateData,
    INpcItemSaveData,
    INpcTechData,
    INpcData,
} from "./classes/npc/interfaces";
export { IEncounterData } from "./classes/encounter/Encounter";
export { IMissionData } from "./classes/encounter/Mission";
export { IMissionStep } from "./classes/encounter/IMissionStep";
export { IActor } from "./classes/encounter/IActor";
export { IActiveMissionData } from "./classes/encounter/ActiveMission";
export { IContentPackManifest, IContentPack } from "./classes/ContentPack";
export { ICounterData } from "./classes/Counter";
export { ITagCompendiumData } from "./classes/Tag";

export * from "./classes/GeneralInterfaces";
/*
export {
    IAIData,
    IBasicEffectData,
    IChargeData,
    IChargeEffectData,
    IDeployableData,
    IDroneData,
    IEffectData,
    IBonusEffectData,
    IProtocolEffectData,
    IReactionEffectData,
    IProfileEffectData,
    IOffensiveEffectData,
    ICompendiumItemData,
    ILicensedItemData,
    ICoreData,
    IFrameData,
    IFrameStats,
    IMechEquipmentData,
    IDamageData,
    IRangeData,
    IMechSystemData,
    IWeaponModData,
    ICoreBonusData,
    IPilotEquipmentData,
    IPilotArmorData,
    IPilotWeaponData,
    IPilotGearData,
    IManufacturerData,
    IFactionData,
    IMissionStep,
    IActor,
    ITalentData,
    ISkillData,
    IMechWeaponData,
    INpcFeatureData,
    INpcReactionData,
    INpcSystemData,
    INpcTechData,
    INpcDamageData,
    INpcWeaponData,
    INpcStats,
    INpcClassData,
    INpcTemplateData,
    INpcData,
    INpcItemSaveData,
    IEncounterData,
    IMissionData,
    IActiveMissionData,
    IContentPackManifest,
    IContentPack,
    ICounterData,
    ITagCompendiumData,
    IInvadeOptionData,
    ITechEffectData,
};
*/
