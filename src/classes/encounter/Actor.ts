// Contains logic for mixing in current state of a mech
/*
export class MixActor extends Mixin<IIsActor> {
    /*
    private _actions: Action[] = [];
    public get list(): readonly Action[] { return this._actions; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Action> {
        return this._actions[Symbol.iterator]();
    }

    public load(data: IHasActions) {
        this._actions = data.actions?.map(a => new Action(a)) || [];
    }

    public save(): IHasActions {
        return {
            actions: this._actions.map(a => a.save()),
        }
    }

    NewTurn: () => void;
    FullRepair: () => void;
}
*/

export interface VActor {
    ID: string;
    EncounterName: string;
    Image: string;
    Conditions: string[];
    Statuses: string[];
    Resistances: string[];
    Burn: number;
    Destroyed: boolean;
    Defeat: string;
    Activations: number;
    Evasion: number;
    EDefense: number;
    TurnActions: number;
    CurrentStructure: number;
    CurrentHP: number;
    CurrentStress: number;
    CurrentHeat: number;
    MaxStructure: number;
    MaxHP: number;
    MaxStress: number;
    HeatCapacity: number;
    CurrentMove: number;
    MaxMove: number;
    Reactions: string[];
    Icon: string;
    NewTurn: () => void;
    FullRepair: () => void;
}
