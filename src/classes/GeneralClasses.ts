// I don't know why these are ambient - perhaps lack of a fitting home
export interface Brew {
    info: string;
    dir: string;
}

export interface PrintOptions {
    mech_id: string;
    loadout_index: number;
    combo: boolean;
}
