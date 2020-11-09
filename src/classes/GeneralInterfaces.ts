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
    custom?: boolean;
    custom_desc?: string;
    custom_detail?: string;
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
export interface IHistoryItem {
    field: string;
    val?: any;
}
/*
export interface IEquipmentSaveData {
    id: string;
    destroyed: boolean;
    cascading: boolean;
    note: string;
    uses?: number;
    flavorName?: string;
    flavorDescription?: string;
    customDamageType?: string;
}

export interface IMechWeaponSaveData extends IEquipmentSaveData {
    loaded: boolean;
    mod?: IEquipmentSaveData;
    customDamageType?: string;
    maxUseOverride?: number;
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

*/
