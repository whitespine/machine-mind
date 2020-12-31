// Maintain this file as the single point of import for all class definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored
// first in this file.

export * from "@src/classes/GeneralClasses";
export { Rules } from "./classes/utility/Rules";
// export { ItemFilter, ItemFilterParam } from "./classes/utility/ItemFilter";
export { Action } from "./classes/Action";
export { Bonus } from "./classes/Bonus";
export { Deployable } from "./classes/Deployable";
// export { LicensedItem } from "./classes/LicensedItem";
export { CoreBonus } from "./classes/pilot/CoreBonus";
export { Damage } from "./classes/Damage";
export { Range } from "./classes/Range";
export { Synergy } from "@src/classes/Synergy";
export { Skill } from "./classes/pilot/Skill";
export { PilotArmor, PilotGear, PilotWeapon, PilotEquipment } from "./classes/pilot/PilotEquipment";
export { CoreSystem } from "./classes/mech/CoreSystem";
export { Frame } from "./classes/mech/Frame";
export { FrameTrait } from "./classes/mech/FrameTrait";
import { MechSystem } from "./classes/mech/MechSystem";
export { WeaponMod } from "./classes/mech/WeaponMod";
import { MechWeapon, MechWeaponProfile } from "./classes/mech/MechWeapon";
export type MechEquipment = MechSystem | MechWeapon;
export { MechWeapon, MechSystem, MechWeaponProfile };

export { Talent } from "./classes/pilot/Talent";
export { License } from "./classes/License";
export { MechSkills } from "./classes/pilot/MechSkills";
export { PilotLoadout } from "./classes/pilot/PilotLoadout";
export { Quirk } from "./classes/pilot/Quirk";
export { Pilot } from "./classes/pilot/Pilot";
export { TagInstance, TagTemplate } from "./classes/Tag";
export { MechLoadout, WeaponMount, WeaponSlot, SystemMount } from "./classes/mech/MechLoadout";
export { Mech } from "./classes/mech/Mech";
export { Reserve } from "./classes/pilot/reserves/Reserve";
// export { Project } from "./classes/pilot/reserves/Project";
export { Organization } from "./classes/pilot/reserves/Organization";
export { Manufacturer } from "./classes/Manufacturer";
export { Faction } from "./classes/Faction";
// export { Statblock } from "./classes/Statblock";
/*
export {
    DiceRoller,
    D20RollResult,
    DamageRollResult,
    ParsedDieString,
    DieSet,
} from "../babyjail/classes/dice/DiceRoller";
export { DiceStats, DiceStatsResult } from "./classes/dice/DiceStats";
*/
// export { Encounter } from "./classes/encounter/Encounter.dts";
// export { Rest } from "./classes/encounter/Rest";
// export { Mission, MissionStepType } from "./classes/encounter/Mission";
// export { ActiveMission } from "./classes/encounter/ActiveMission";
export { Sitrep } from "./classes/encounter/Sitrep";
export { Environment } from "./classes/encounter/Environment";
export { Status } from "./classes/Statuses";
// export { ContentPack } from "./classes/ContentPack";
// export { PersistentStore } from "./io/persistence";
export { Counter } from "./classes/Counter";
export { Npc } from "@src/classes/npc/Npc";
export { NpcFeature } from "@src/classes/npc/NpcFeature";
export { NpcClass } from "@src/classes/npc/NpcClass";
export { NpcTemplate } from "@src/classes/npc/NpcTemplate";
// export { NpcItem } from "@src/classes/npc/NpcItem";
// export { NpcReaction } from "@src/classes/npc/NpcReaction";
// export { NpcSystem } from "@src/classes/npc/NpcSystem";
// export { NpcTech } from "@src/classes/npc/NpcTech";
// export { NpcTrait } from "@src/classes/npc/NpcTrait";
// export { NpcWeapon } from "@src/classes/npc/NpcWeapon";
// export { NpcStats } from "@src/classes/npc/NpcStats";
// export { NpcClass } from "@src/classes/npc/NpcClass";
// export { Npc } from "@src/classes/npc/Npc";
