import { CompendiumItem } from "../registry;

export interface ISitrepData {
    id: string;
    name: string;
    description: string;
    pcVictory: string;
    enemyVictory: string;
    noVictory?: string;
    deployment?: string;
    objective?: string;
    controlZone?: string;
    extraction?: string;
}

export class Sitrep {
    private _id: string;
    private _name: string;
    private _description: string;
    private _pcVictory: string;
    private _enemyVictory: string;
    private _noVictory?: string | null;
    private _deployment?: string | null;
    private _objective?: string | null;
    private _controlZone?: string | null;
    private _extraction?: string | null;

    constructor() {
        this._id = "";
        this._name = "";
        this._description = "";
        this._pcVictory = "";
        this._enemyVictory = "";
    }

    public static Serialize(dat: Sitrep): ISitrepData {
        return {
            id: dat._id,
            name: dat._name,
            description: dat._description,
            pcVictory: dat._pcVictory,
            enemyVictory: dat._enemyVictory,
            noVictory: dat._noVictory,
            deployment: dat._deployment,
            objective: dat._objective,
            controlZone: dat._controlZone,
            extraction: dat._extraction,
        };
    }

    public static Deserialize(data: ISitrepData): Sitrep {
        let result = new Sitrep();

        // Simple populate
        result._id = data.id;
        result._name = data.name;
        result._description = data.description;
        result._pcVictory = data.pcVictory;
        result._enemyVictory = data.enemyVictory;
        result._noVictory = data.noVictory;
        result._deployment = data.deployment;
        result._objective = data.objective;
        result._controlZone = data.controlZone;
        result._extraction = data.extraction;

        return result;
    }
}
