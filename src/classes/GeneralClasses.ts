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

export interface Faction {
    id: string;
    name: string;
    description: string;
    logo: string;
    color: string;
}

export interface Status {
    name: string;
    type: 'Status' | 'Condition';
    icon: string;
    effects: string[];
}

export interface Environment {
    id: string;
    name: string;
    description: string;
}

export interface Sitrep {
    id: string;
    name: string;
    description: string;
    pcVictory: string;
    enemyVictory: string;
    noVictory?: string | null;
    deployment?: string | null;
    objective?: string | null;
    controlZone?: string | null;
    extraction?: string | null;
}

export interface FrameTrait {
    name: string;
    description: string;
}
