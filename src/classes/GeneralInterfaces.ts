import { License } from './License';

export interface IImageContainer {
    SetLocalImage(): any;
    SetCloudImage(): any;
    Image: string;
}

export interface INotificationVariant {
    color: string;
    icon: string;
    prefix?: string | null;
    timeout?: number | null;
}
export interface INotification {
    id: string;
    variant: string;
    text: string;
    onClick?: null | (() => void);
}

export interface IErrorReport {
    time: Date;
    message: string;
    component?: string | null;
    stack: string;
}

export interface IDiceStats {
    min: number;
    max: number;
    mean: number;
    error: boolean;
    diceString: string;
}

export interface Id20RollResult {
    total: number;
    rawDieRoll: number;
    staticBonus: number;
    accuracyDiceCount: number; // net accuracy dice total - negative if at disadvantage
    rawAccuracyRolls: number[]; // results of each accuracy/disadvantage die
    accuracyResult: number;
}

export interface IDamageRollResult {
    diceString: string;
    total: number;
    rawDieRolls: number[];
    staticBonus: number;
    parseError: boolean;
}

export interface IRankedData {
    id: string;
    rank: number;
    custom?: boolean | null;
    custom_desc?: string | null;
    custom_detail?: string | null;
}

export interface IEquipmentData {
    id: string;
    destroyed: boolean;
    cascading: boolean;
    note: string;
    uses?: number | null;
    flavorName?: string | null;
    flavorDescription?: string | null;
    customDamageType?: string | null;
}

export interface IMechWeaponSaveData extends IEquipmentData {
    loaded: boolean;
    mod?: IEquipmentData | null;
    customDamageType?: string | null;
    maxUseOverride?: number | null;
}

export interface ICounterSaveData {
    id: string;
    val: number;
}

export interface IPilotData {
    id: string;
    campaign: string;
    group: string;
    sort_index: number;
    cloudID: string;
    cloudOwnerID: string;
    lastCloudUpdate: string;
    level: number;
    callsign: string;
    name: string;
    player_name: string;
    status: string;
    mounted: boolean;
    factionID: string;
    text_appearance: string;
    notes: string;
    history: string;
    portrait: string;
    cloud_portrait: string;
    quirk: string;
    current_hp: number;
    background: string;
    mechSkills: number[];
    licenses: IRankedData[];
    skills: IRankedData[];
    talents: IRankedData[];
    core_bonuses: string[];
    reserves: IReserveData[];
    orgs: IOrganizationData[];
    loadout: IPilotLoadoutData;
    mechs: IMechData[];
    active_mech: string | null;
    cc_ver: string;
    counter_data: ICounterSaveData[];
    custom_counters: object[];
    brews: string[];
}

export interface IReserveData {
    id: string;
    type?: string | null;
    name?: string | null;
    label?: string | null;
    description?: string | null;
    resource_name?: string | null;
    resource_note?: string | null;
    resource_cost?: string | null;
    used: boolean;
}

export interface IProjectData extends IReserveData {
    complicated: boolean;
    can_finish: boolean;
    finished: boolean;
    progress: number;
    requirements: string[];
}

export interface IOrganizationData {
    name: string;
    purpose: string;
    description: string;
    efficiency: number;
    influence: number;
    actions: string;
}

export interface IPilotLoadoutData {
    id: string;
    name: string;
    armor: (IEquipmentData | null)[];
    weapons: (IEquipmentData | null)[];
    gear: (IEquipmentData | null)[];
    extendedWeapons: (IEquipmentData | null)[];
    extendedGear: (IEquipmentData | null)[];
}

export interface IHistoryItem {
    field: string;
    val?: any;
}

export interface IMechState {
    stage: string;
    turn: number;
    move: number;
    actions: number;
    overwatch: boolean;
    braced: boolean;
    overcharged: boolean;
    prepare: boolean;
    bracedCooldown: boolean;
    redundant: boolean;
    history: IHistoryItem[];
}

export interface IMechData {
    id: string;
    name: string;
    notes: string;
    gm_note: string;
    portrait: string;
    cloud_portrait: string;
    frame: string;
    active: boolean;
    current_structure: number;
    current_hp: number;
    overshield: number;
    current_stress: number;
    current_heat: number;
    current_repairs: number;
    current_overcharge: number;
    current_core_energy: number;
    loadouts: IMechLoadoutData[];
    active_loadout_index: number;
    statuses: string[];
    conditions: string[];
    resistances: string[];
    reactions: string[];
    burn: number;
    ejected: boolean;
    destroyed: boolean;
    defeat: string;
    activations: number;
    meltdown_imminent: boolean;
    reactor_destroyed: boolean;
    cc_ver: string;
    state: IMechState;
}

export interface IMechLoadoutData {
    id: string;
    name: string;
    systems: IEquipmentData[];
    integratedSystems: IEquipmentData[];
    mounts: IMountData[];
    integratedMounts: { weapon: IMechWeaponSaveData; source: string }[];
    improved_armament: IMountData;
    integratedWeapon: IMountData;
}

export interface IMountData {
    mount_type: string;
    lock: boolean;
    slots: IWeaponSlotData[];
    extra: IWeaponSlotData[];
    bonus_effects: string[];
}

export interface IWeaponSlotData {
    size: string;
    weapon: IMechWeaponSaveData | null;
}

export interface ITagData {
    id: string;
    val?: string | number | null;
}
export interface ISnackbarSettings {
    text: string;
    multiline?: boolean | null;
    timeout?: number | null;
    color?: string | null;
    visible?: boolean | null;
}
