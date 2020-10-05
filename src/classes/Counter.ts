import { ICounterSaveData } from "@/interface";
import { ident, ident_drop_null, MixBuilder, RWMix, MixLinks, uuid, def_empty_map, ident_strict, def, defn, defs } from "@/mixmeta";
import { Registry } from './registry';

/* eslint-disable @typescript-eslint/camelcase */
export interface ICounterData {
    id: string;
    name: string;
    min?: number ;
    max?: number;
    default_value?: number;
}

export interface Counter extends MixLinks<ICounterData> {
    ID: string;
    Name: string;
    Min: number;
    Max: number | null;
    Default: number;

    // This changes over time
    CurrentValue: number;

    // Methods
    Validate(): void;
    Set(inputValue: number): void;
    Reset(): void;
    Increment(): void;
    Decrement(): void;
    SaveData(data: ICounterSaveData): ICounterSaveData;
    LoadData(data: ICounterSaveData): void;
}

export async function CreateCounter(data: ICounterData, ctx: Registry): Promise<Counter>{
    let mb = new MixBuilder<Counter, ICounterData>({
        Validate,
        Set, Reset, Increment, Decrement, SaveData, LoadData
    });
    mb.with(new RWMix("ID", "id", ident_strict, ident));
    mb.with(new RWMix("Name", "name", defs("New counter"), ident));
    mb.with(new RWMix("Min", "min", defn(0), ident));
    mb.with(new RWMix("Max", "max", def<number | null>(null), ident_drop_null));
    mb.with(new RWMix("Default", "default_value", defn(0), ident));

    let rv = await mb.finalize(data, ctx);

    // Check our data. Currently errors - we should make it a bit more tolerant
    rv.Validate();
    return rv;
}
function Validate(this: Counter) {
    if (this.Max && this.CurrentValue > this.Max) {
        console.error(
            `Error in Counter: Value of ${this.CurrentValue} is greater than max value of ${this.Max}`
        );
        this.CurrentValue = this.Max;
    }

    if (this.CurrentValue < this.Min) {
        console.error(
            `Error in Counter: Value of ${this.CurrentValue} is lesser than min value of ${this.Min}`
        );
        this.CurrentValue = this.Min;
    }
}

function Increment(this: Counter): void {
    this.CurrentValue++;
    this.Validate();
}

function Decrement(this: Counter): void {
    this.CurrentValue--;
    this.Validate();
}

function Set(this: Counter, inputValue: number): void {
    if (typeof inputValue !== "number" || isNaN(inputValue)) return; // Can't hurt - leftover beef code
    let value = inputValue;
    this.CurrentValue = value;
    this.Validate();
}

function Reset(this: Counter): void {
    this.CurrentValue = this.Default;
}

function SaveData(this: Counter, data: ICounterSaveData): ICounterSaveData {
    return {
        id: this.ID,
        val: this.CurrentValue,
    };
}

function LoadData(this: Counter, data: ICounterSaveData): void {
    this.Set(data.val);
}

// Mixin stuff

export const CountersMixReader = def_empty_map(CreateCounter);
