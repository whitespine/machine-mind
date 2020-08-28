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
    IBackground,
    IReserveData,
    ICoreBonusData,
    ITalentData,
    IMechWeaponData,
    IMechSystemData,
    ITagData,
    ISkillData,
    IFrameData,
    IFactionData,
    IManufacturerData,
    IWeaponModData,
    INpcClassData,
    INpcFeatureData,
    INpcTemplateData,
    IPilotEquipmentData,
    ITagCompendiumData,
    IStatusData,
    ISitrepData,
    IEnvironmentData,
    IActionData
} from "@/interface";
import { Rules } from "@/class";

export interface GlossaryItem {
    name: string;
    description: string; // v-html
}
export const glossary = _glossary as GlossaryItem[];

export const actions = _actions as IActionData[];
export const backgrounds = _backgrounds as IBackground[];
export const core_bonuses = _core_bonuses as ICoreBonusData[];
export const environments = _environments as IEnvironmentData[];
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
export const sitreps = _sitreps as ISitrepData[];
export const skills = _skills as ISkillData[];
export const statuses = _statuses as IStatusData[];
export const systems = _systems as IMechSystemData[];
export const tags = _tags as ITagCompendiumData[];
export const talents = _talents as ITalentData[];
export const weapons = _weapons as IMechWeaponData[];

export const rules = Rules;