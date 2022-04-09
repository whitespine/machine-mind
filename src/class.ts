// Maintain this file as the single point of import for all class definitions
// (to the extent possible) in order to avoid any circular reference errors. Basic types and
// abstract classes should be imported before their children. AFAIK the definitions can be
// stored anywhere and collected imports are fine as long as their constituents are impored
// first in this file.

export * from "@src/classes/GeneralClasses";
export { Rules } from "./classes/utility/Rules";
export { Damage } from "./classes/components/Damage";
export { Range } from "./classes/components/Range";
export { Action } from "./classes/components/Action";
export { Bonus } from "./classes/components/Bonus";
export { Deployable } from "./classes/mech/Deployable";
export { CoreBonus } from "./classes/pilot/CoreBonus";
export { Synergy } from "@src/classes/components/Synergy";
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
export { License } from "./classes/utility/License";
export { MechSkills } from "./classes/pilot/MechSkills";
export { PilotLoadout } from "./classes/pilot/PilotLoadout";
export { Quirk } from "./classes/pilot/Quirk";
export { Pilot } from "./classes/pilot/Pilot";
export { TagInstance, TagTemplate } from "./classes/components/Tag";
export { MechLoadout, WeaponMount, WeaponSlot, SystemMount } from "./classes/mech/MechLoadout";
export { Mech } from "./classes/mech/Mech";
export { Reserve } from "./classes/pilot/reserves/Reserve";
export { Organization } from "./classes/pilot/reserves/Organization";
export { Manufacturer } from "./classes/utility/Manufacturer";
export { Faction } from "./classes/utility/Faction";
export { Sitrep } from "./classes/encounter/Sitrep";
export { Environment } from "./classes/encounter/Environment";
export { Status } from "./classes/mech/Statuses";
export { Counter } from "./classes/components/Counter";
export { Npc } from "@src/classes/npc/Npc";
export { NpcFeature } from "@src/classes/npc/NpcFeature";
export { NpcClass } from "@src/classes/npc/NpcClass";
export { NpcClassStats } from "@src/classes/npc/NpcClassStats";
export { NpcTemplate } from "@src/classes/npc/NpcTemplate";