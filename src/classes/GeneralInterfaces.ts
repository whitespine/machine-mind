export interface IImageContainer {
    SetLocalImage(): any;
    SetCloudImage(): any;
    Image: string;
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

export interface PackedRankedData {
    id: string;
    rank: number;
    custom?: boolean;
    custom_desc?: string;
    custom_detail?: string;
}
export interface IMechState {
    active_mech_id: string,
    stage: string,
    turn: number,
    actions: number,
    braced: boolean,
    overcharged: boolean,
    prepare: boolean,
    bracedCooldown: boolean,
    redundant: boolean,
    mounted: boolean,
    stats: {
        moves: number,
        kills: number,
        damage: number,
        hp_damage: number,
        structure_damage: number,
        overshield: number,
        heat_damage: number,
        reactor_damage: number,
        overcharge_uses: number,
        core_uses: number
    },
    deployed: []
}
export interface IHistoryItem {
    field: string;
    val?: any;
}
