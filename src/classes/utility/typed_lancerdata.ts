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
    PackedReserveData,
    PackedCoreBonusData,
    PackedTalentData,
    PackedMechWeaponData,
    PackedMechSystemData,
    PackedSkillData,
    PackedFrameData,
    IFactionData,
    PackedWeaponModData,
    // PackedNpcClassData,
    // PackedNpcFeatureData,
    // PackedNpcTemplateData,
    // PackedPilotEquipmentData,
    ITagTemplateData,
    IStatusData,
    ISitrepData,
    IEnvironmentData,
    IActionData,
    PackedPilotEquipmentData,
    PackedManufacturerData,
} from "@src/interface";
import { Rules } from "@src/class";

export interface GlossaryItem {
    name: string;
    description: string; // v-html
}
export const glossary = _glossary as GlossaryItem[];

export const actions = _actions as IActionData[];
export const backgrounds = _backgrounds as IBackground[];
export const core_bonuses = _core_bonuses as PackedCoreBonusData[];
export const environments = _environments as IEnvironmentData[];
export const factions = _factions as IFactionData[];
export const frames = _frames as PackedFrameData[];

export const info = _info as {
    name: string;
    author: string;
    version: string;
    description: string;
    website: string;
    active: true;
};
export const manufacturers = _manufacturers as PackedManufacturerData[];
export const mods = _mods as PackedWeaponModData[];
// export const npc_classes = _npc_classes as PackedNpcClassData[];
// export const npc_features = _npc_features as PackedNpcFeatureData[];
// export const npc_templates = _npc_templates as PackedNpcTemplateData[];
export const pilot_gear = _pilot_gear as PackedPilotEquipmentData[];
export const quirks = _quirks as string[];
export const reserves = _reserves as PackedReserveData[];
export const sitreps = _sitreps as ISitrepData[];
export const skills = _skills as PackedSkillData[];
export const statuses = _statuses as IStatusData[];
export const systems = _systems as PackedMechSystemData[];
export const tags = _tags as ITagTemplateData[];
export const talents = _talents as PackedTalentData[];
export const weapons = _weapons as PackedMechWeaponData[];

export const rules = Rules;
