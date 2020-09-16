import { ActivationType, Counter } from '@/class';
import { IActionData, IBonusData, ISynergyData, ICounterData } from '@/interface';
import { MixBuilder, Mixlet, MixLinks } from '@/mixmeta';
import { ident } from 'lodash';
import { Action, ActionMixReader, ActionMixWriter } from './Action';
import { Bonus, BonusMixReader, BonusMixWriter } from './Bonus';
import { Synergy, SynergyMixReader, SynergyMixWriter } from './Synergy';
import { ITagInstanceData, TagInstance, TagInstanceMixReader, TagInstanceMixWriter } from './Tag';

export interface IDeployableData {
    name: string,
    type: string, // this is for UI furnishing only,
    detail: string,
    activation: ActivationType,
    deactivation?: ActivationType,
    recall?: ActivationType,
    redeploy?: ActivationType,
    size: number,
    cost?: number
    armor?: number,
    hp?: number,
    evasion?: number,
    edef?: number,
    heatcap?: number,
    repcap?: number,
    sensor_range?: number,
    tech_attack?: number,
    save?: number,
    speed?: number,
    actions?: IActionData[],
    bonuses?: IBonusData[],
    synergies?: ISynergyData[],
    counters?: ICounterData[],
    tags?: ITagInstanceData[],
}

export interface Deployable extends MixLinks<IDeployableData> {
    Name: string,
    Type: string, // this is for UI furnishing only,
    Detail: string,
    Activation: ActivationType,
    Deactivation: ActivationType,
    Recall: ActivationType,
    Redeploy: ActivationType,
    Size: number,
    Cost: number
    Armor: number,
    HP: number | null,
    Evasion: number | null,
    EDef: number | null,
    HeatCap: number | null,
    RepairCap: number | null,
    SensorRange: number | null,
    TechAttack: number | null,
    Save: number | null,
    Speed: number | null,
    Actions: Action[],
    Bonuses: Bonus[],
    Synergies: Synergy[],
    Counters: Counter[],
    Tags: TagInstance[],
}

// function ident<T>(v: T): T {return v;}

export function CreateDeployable(data: IDeployableData | null): Deployable {
    let b = new MixBuilder<Deployable, IDeployableData>({});
    b.with(new Mixlet("Name", "name", "New Deployable", ident(, ident));
    b.with(new Mixlet("Type", "type", "custom", ident, ident));
    b.with(new Mixlet("Detail", "detail", "No description", ident, ident));
    b.with(new Mixlet("Activation", "activation", ActivationType.None, ident, ident));
    b.with(new Mixlet("Deactivation", "deactivation", ActivationType.None, ident, ident));
    b.with(new Mixlet("Recall", "recall", ActivationType.None, ident, ident));
    b.with(new Mixlet("Redeploy", "redeploy", ActivationType.None, ident, ident));
    b.with(new Mixlet("Size", "size", .5, ident, ident)); // deployables tend to be smaller
    b.with(new Mixlet("Cost", "cost", 1, ident, ident)); // No idea what this is - maybe charge usage (like for walking armory type systems)
    b.with(new Mixlet("Armor", "armor", 0, ident, ident)); 
    b.with(new Mixlet("HP", "hp", null, ident, ident)); 
    b.with(new Mixlet("Evasion", "hp", null, ident, ident)); 
    b.with(new Mixlet("EDef", "edef", null, ident, ident)); 
    b.with(new Mixlet("HeatCap", "heatcap", null, ident, ident)); 
    b.with(new Mixlet("RepairCap", "repcap", null, ident, ident)); 
    b.with(new Mixlet("SensorRange", "sensor_range", null, ident, ident)); 
    b.with(new Mixlet("TechAttack", "tech_attack", null, ident, ident)); 
    b.with(new Mixlet("Save", "save", null, ident, ident)); 
    b.with(new Mixlet("Speed", "speed", null, ident, ident)); 
    b.with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter)); 
    b.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter)); 
    b.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, ident)); 
    b.with(new Mixlet("Counters", "counters", [], CounterMixReader, CounterMixWriter)); 
    b.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter)); 
    

    let r = b.finalize(data);
    return r;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const DeployableMixReader = (x: IDeployableData[] | null | undefined) => (x || []).map(CreateDeployable);
export const DeployableMixWriter = (x: Deployable[]) => x.map(i => i.Serialize());

/*
export interface IDeployedData {
    id: string;
    assigned_name: string;
    current_hp: number;
    current_duration?: number;
    overshield?: number;
    isDestroyed?: boolean;
}
export class Deployed {
    private _deployable: Deployable;
    private _current_hp: number;
    private _current_overshield: number;
    private _current_duration: number | null;
    private _isDestroyed: boolean;
    private _name: string = "";

    constructor(data: IDeployedData) {
        this._deployable = store.compendium.getReferenceByID("Deployables", data.id);
        this._current_hp = this._deployable.MaxHP;
        this._isDestroyed = false;
        this._name = data.assigned_name;
        this._current_duration = data.current_duration || null;
        this._current_overshield = data.overshield;
    }

    public Serialize(): IDeployedData {
        return {
            id: this._deployable.ID,
            assigned_name: this.Name,
            current_hp: this.CurrentHP,
            isDestroyed: this.IsDestroyed,
            overshield: this.Overshield
        };
    }

    public get Deployable(): Deployable {
        return this._deployable;
    }


    public get IsDestroyed(): boolean {
        return this._isDestroyed;
    }

    public set IsDestroyed(val: boolean) {
        this._isDestroyed = val;
        this.save();
    }

    public get Name(): string {
        return this._name;
    }

    public set Name(name: string) {
        this._name = name;
        this.save();
    }
    
    public get CurrentOvershield(): number {
        return this._current_overshield;
    }

    public set CurrentOvershield(overshield: number) {
        this._current_overshield = overshield;
        this.save();
    }

    public get CurrentHP(): number {
        return this._current_hp;
    }

    // Bounded setter, updates destroyed
    public set CurrentHP(hp: number) {
        if (hp > this._deployable.MaxHP) this._current_hp = this._deployable.MaxHP;
        else if (hp <= 0) {
            this.IsDestroyed = true;
            this._current_hp = 0;
        } else this._current_hp = hp;
        this.save();
    }

    // Apply damage, first to overshields, then to hp
    public InflictDamage(amt: number) {
        // If OS can tank, do it.
        if(amt <= this.CurrentOvershield) {
            this.CurrentOvershield -= amt;
        } 

        // Otherwise, neutralize OS, and then apply remained to hp
        amt -= this.CurrentOvershield;
        this.CurrentOvershield = 0;
        this.CurrentHP -= amt;
    }

    private save(): void {
        store.pilots.saveData();
    }
}

export class Deployable {
    public readonly ID: string;
    public readonly Source: string;
    public readonly License: string;
    public readonly Detail: string;
    public readonly Size: number;
    public readonly MaxHP: number;
    public readonly Armor: number;
    public readonly Evasion: number;
    public readonly EDefense: number;
    private name_ctr: number = 1;

    public constructor(data: IDeployableData, parent_item: CompendiumItem, owner?: string) {
        this.ID = parent_item.ID + data.(); // TODO: Unify how we do this with compcon
        this.Source = data.source;
        this.License = data.license;
        this.Detail = data.detail;
        this.Size = data.size;
        this.MaxHP = data.hp;
        this.Armor = data.armor || 0;
        this.Evasion = data.evasion;
        this.EDefense = data.edef;
    }
}


    public Deploy(owner?: string, index?: string) {
        if(index === undefined) {
            index = "" + (++this.name_ctr);
        }

        this.BaseName = `${owner ? `${owner}'s ` : ""}${data.name}${n ? ` (#${n})` : ""}`;
    }

}
*/