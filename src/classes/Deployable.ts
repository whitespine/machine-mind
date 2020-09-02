import { ActivationType } from '@/class';
import { IActionData, IBonusData, ISynergyData, ICounterData, ITagData } from '@/interface';

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
    tags?: ITagData[],
}


export class Deployable {
    private readonly data: IDeployableData;
    constructor(data: IDeployableData) {
        this.data = {...data};
    }

    public Serialize(): IDeployableData {
        return {...this.data};
    }
}


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