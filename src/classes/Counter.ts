import { bound_int } from "@/funcs";
import { SimSer } from "@/new_meta";

/* eslint-disable @typescript-eslint/camelcase */
export interface PackedCounterData {
    id: string;
    name: string;
    level?: number;
    min?: number;
    max?: number;
    default_value?: number;
    custom?: boolean;
}

export interface PackedCounterSaveData {
    id: string;
    val: number;
}

export interface RegCounterData extends PackedCounterData {
    val: number;
}

// This is kinda weird because I think the compcon storage strategy is kinda dumb. So, when we load, we take both the ICounterData as well as an array off ICounterSaveData
export function unpack_counter_data(
    packed_counters: PackedCounterData[],
    counter_saves: PackedCounterSaveData[]
) {
    // Init
    let out: RegCounterData[] = packed_counters.map(x => ({
        ...x,
        val: x.default_value || x.min || 0,
    }));

    // Load saves
    for (let cnt of out) {
        let save = counter_saves.find(y => y.id == cnt.id);
        if (save) {
            cnt.val = save.val;
        }
    }

    return out;
}

export class Counter extends SimSer<RegCounterData> {
    public ID!: string;
    public Name!: string;
    public Level!: number | null;
    public Min!: number;
    public Max!: number | null;
    public Default!: number;
    private _value!: number;

    protected load(data: RegCounterData) {
        this.ID = data.id;
        this.Name = data.name;
        this.Level = data.level || null;
        this.Min = data.min || 0;
        this.Max = data.max || null;
        this._value = data.val;
    }

    public save(): RegCounterData {
        throw new Error('Method not implemented.');
    }


    // Bound on set
    public get Value(): number {
        return this._value;
    }

    public set Value(new_val: number) {
        this._value = bound_int(new_val, this.Min, this.Max || Number.MAX_SAFE_INTEGER);
    }

    // Easy bois
    public Increment(): void {
        this.Value += 1;
    }
    public Decrement(): void {
        this.Value -= 1;
    }

    public Reset(): void {
        this._value = this.Default;
    }
}
