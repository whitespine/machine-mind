import {
    glossary as _glossary,
    actions as _actions,
    backgrounds as _backgrounds,
    core_bonuses as _core_bonuses,
    environments as _environments,
    factions as _factions,
    frames as _frames,
    info as _info,
    manufacturers as _manufacturers,
    mods as _mods,
    npc_classes as _npc_classes,
    npc_features as _npc_features,
    npc_templates as _npc_templates,
    pilot_gear as _pilot_gear,
    quirks as _quirks,
    reserves as _reserves,
    rules as _rules,
    sitreps as _sitreps,
    skills as _skills,
    statuses as _statuses,
    systems as _systems,
    tags as _tags,
    talents as _talents,
    weapons as _weapons,
} from "lancer-data";
import {
    IReserveData,
    ICoreBonusData,
    ITalentData,
    IMechWeaponData,
    IMechSystemData,
    ITagData,
    ISkillData,
    IFrameData,
    IFactionData,
} from "@/interface";
import { Sitrep, Status, Environment } from "@/class";
import { IPilotEquipmentData } from "./classes/pilot/PilotEquipment";
import { INpcTemplateData, INpcFeatureData, INpcClassData } from "./classes/npc/interfaces";
import { IWeaponModData } from "./classes/mech/WeaponMod";
import { IManufacturerData } from "./classes/Manufacturer";
import { ITagCompendiumData } from "./classes/Tag";

export interface GlossaryItem {
    name: string;
    description: string;
}
export const glossary = _glossary as GlossaryItem[];

export interface CombatAction {
    id: string;
    name: string;
    reserve: boolean;
    action_type: string;
    description: string;
    detai: string;
}
export const actions = _actions as CombatAction[];

export interface Background {
    id: string;
    name: string;
    description: string;
    triggers: string;
}
export const backgrounds = _backgrounds as Background[];

// export type MountFitting = "Auxillary" | "Main" | "Flex" | "Heavy"
export interface Rules {
    base_structure: number;
    base_stress: number;
    base_grapple: number;
    base_ram: number;
    base_pilot_hp: number;
    base_pilot_evasion: number;
    base_pilot_edef: number;
    base_pilot_speed: number;
    minimum_pilot_skills: number;
    minimum_mech_skills: number;
    minimum_pilot_talents: number;
    trigger_bonus_per_rank: number;
    max_trigger_rank: number;
    max_pilot_level: number;
    max_pilot_weapons: number;
    max_pilot_armor: number;
    max_pilot_gear: number;
    max_frame_size: number;
    max_mech_armor: number;
    max_hase: number;
    mount_fittings: {
        Auxiliary: ["Auxiliary"];
        Main: ["Main", "Auxiliary"];
        Flex: ["Main", "Auxiliary"];
        Heavy: ["Superheavy", "Heavy", "Main", "Auxiliary"];
    };
    overcharge: string[];
    skill_headers: Array<{
        attr: string;
        description: string;
    }>;
}
export const rules = _rules as Rules;

export const core_bonuses = _core_bonuses as ICoreBonusData[];
export const environments = _environments as Environment[];
export const factions = _factions as IFactionData[];
export const frames = _frames as IFrameData[];

export const info = _info as {
    name: string;
    author: string;
    version: string;
    description: string;
    website: string;
    active: true;
};
export const manufacturers = _manufacturers as IManufacturerData[];
export const mods = _mods as IWeaponModData[];
export const npc_classes = _npc_classes as INpcClassData[];
export const npc_features = _npc_features as INpcFeatureData[];
export const npc_templates = _npc_templates as INpcTemplateData[];
export const pilot_gear = _pilot_gear as IPilotEquipmentData[];
export const quirks = _quirks as string[];
export const reserves = _reserves as IReserveData[];
export const sitreps = _sitreps as Sitrep[];
export const skills = _skills as ISkillData[];
export const statuses = _statuses as Status[];
export const systems = _systems as IMechSystemData[];
export const tags = _tags as ITagCompendiumData[];
export const talents = _talents as ITalentData[];
export const weapons = _weapons as IMechWeaponData[];
