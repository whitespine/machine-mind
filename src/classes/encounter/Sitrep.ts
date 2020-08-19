import { CompendiumItem } from '../CompendiumItem';

export interface ISitrepData {
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

    public Serialize(): ISitrepData {
        return {
            id: this._id,
            name: this._name,
            description: this._description,
            pcVictory: this._pcVictory,
            enemyVictory: this._enemyVictory,
            noVictory: this._noVictory,
            deployment: this._deployment,
            objective: this._objective,
            controlZone: this._controlZone,
            extraction: this._extraction,
        }
    }

    public static Deserialize(data: ISitrepData): Sitrep {
        let result = new Sitrep();

        // Simple populate
        result._id= data.id;
        result._name= data.name;
        result._description= data.description;
        result._pcVictory= data.pcVictory;
        result._enemyVictory= data.enemyVictory;
        result._noVictory= data.noVictory;
        result._deployment= data.deployment;
        result._objective= data.objective;
        result._controlZone= data.controlZone;
        result._extraction= data.extraction;

        return result;
    }
}