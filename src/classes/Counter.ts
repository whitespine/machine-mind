import { bound_int } from "@src/funcs";
import { SimSer } from "@src/registry";

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

export interface RegCounterData {
    id: string;
    name: string;
    min: number;
    max: number | null;
    default_value: number;
    val: number;
}

// This is kinda weird because I think the compcon storage strategy is kinda dumb. So, when we load, we take both the ICounterData as well as an array off ICounterSaveData

export class Counter extends SimSer<RegCounterData> {
    public ID!: string;
    public Name!: string;
    // public Level!: number | null;
    public Min!: number;
    public Max!: number | null;
    public Default!: number;
    private _value!: number;

    public load(data: RegCounterData) {
        this.ID = data.id;
        this.Name = data.name;
        // this.Level = data.level || null;
        this.Min = data.min || 0;
        this.Max = data.max || null;
        this._value = data.val;
    }

    public save(): RegCounterData {
        return {
            id: this.ID,
            name: this.Name,
            val: this.Value,
            max: this.Max,
            min: this.Min,
            default_value: this.Default,
        };
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

    // Doesn't need registers
    static unpack(packed_counter: PackedCounterData): RegCounterData {
        // Init
        let out: RegCounterData = {
            default_value: packed_counter.default_value ?? packed_counter.min ?? 0,
            id: packed_counter.id,
            max: packed_counter.max ?? null,
            min: packed_counter.min ?? 0,
            name: packed_counter.name,
            val: packed_counter.default_value ?? packed_counter.min ?? 0,
        };

        return out;
    }

    // Try to set this counters value from a set of counter save data
    public sync_state_from(counter_saves: PackedCounterSaveData[]) {
        // Load saves
        let save = counter_saves?.find(y => y.id == this.ID);
        if (save) {
            this.Value = save.val;
        }
    }
}
