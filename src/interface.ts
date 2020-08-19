// Maintain this file as the single point of import for all interface definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored

// first in this file.
export { IAIData } from "@/classes/effects/AIEffect";
export { IBasicEffectData } from "@/classes/effects/BasicEffect";
export { IChargeData, IChargeEffectData } from "@/classes/effects/ChargeEffect";
export { IDeployableData } from "@/classes/effects/DeployableEffect";
export { IDroneData } from "@/classes/effects/DroneEffect";
export { IEffectData } from "@/classes/effects/ItemEffect";
export { IBonusEffectData } from "@/classes/effects/BonusEffect";
export { IProtocolEffectData } from "@/classes/effects/ProtocolEffect";
export { IReactionEffectData } from "@/classes/effects/ReactionEffect";
export { IInvadeOptionData, ITechEffectData } from "@/classes/effects/TechEffect";
export { IProfileEffectData } from "@/classes/effects/ProfileEffect";
export { IOffensiveEffectData } from "@/classes/effects/OffensiveEffect";
export { ICompendiumItemData } from "./classes/CompendiumItem";
export * from "@/classes/GeneralClasses";
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
export { ITalentData, ITalentRank } from "./classes/pilot/Talent";
export { ISkillData } from "./classes/pilot/Skill";
export { IMechWeaponData } from "./classes/mech/MechWeapon";
export { INpcFeatureData } from "./classes/npc/NpcFeature";
export { INpcReactionData } from "./classes/npc/NpcReaction";
export { INpcSystemData } from "./classes/npc/NpcSystem";
export { INpcTechData } from "./classes/npc/NpcTech";
export { INpcItemSaveData } from "./classes/npc/NpcItem";
export { INpcDamageData, INpcWeaponData } from "./classes/npc/NpcWeapon";
export { INpcStats } from "./classes/npc/NpcStats";
export { INpcClassData } from "./classes/npc/NpcClass";
export { INpcTemplateData } from "./classes/npc/NpcTemplate";
export { INpcData } from "./classes/npc/Npc";
export { IEncounterData } from "./classes/encounter/Encounter";
export { IMissionData } from "./classes/encounter/Mission";
export { IMissionStep } from "./classes/encounter/IMissionStep";
export { IActor } from "./classes/encounter/IActor";
export { IActiveMissionData } from "./classes/encounter/ActiveMission";
export { IContentPackManifest, IContentPack } from "./classes/ContentPack";
export { ICounterData } from "./classes/Counter";
export { ITagCompendiumData } from "./classes/Tag";
export { CompendiumCategory } from "./store/compendium";
export { DataStoreOptions } from "./store/store_module";
export * from "./classes/GeneralInterfaces";
