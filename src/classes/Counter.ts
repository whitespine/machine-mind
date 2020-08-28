import { ICounterSaveData } from "@/interface";

/* eslint-disable @typescript-eslint/camelcase */
export interface ICounterData {
    id: string;
    name: string;
    min?: number | null;
    max?: number | null;
    default_value?: number | null;
}

export class Counter {
    public readonly ID: string;
    public readonly Name: string;
    public readonly Min: number;
    public readonly Max: number | null;
    public readonly Default: number;

    constructor(data: ICounterData) {
        let { id, name, min, max, default_value } = data;


        this.ID = id;
        this.Name = name;
        this.Min = min || 0;
        this.Max = max || null;
        this.Default = default_value || this.Min;
        this._value =  this.Default;

        if (this.Max && this._value > this.Max) {
            throw new Error(
                `Error creating Counter: Default value of ${default_value} is greater than max value of ${max}`
            );
        }

        if (this._value < this.Min) {
            throw new Error(
                `Error creating Counter: Default value of ${default_value} is lesser than min value of ${min}`
            );
        }

        this._value = this.Default;
    }

    public Serialize(dat: Counter): ICounterData {
        return {
            id: this.ID,
            name: this.Name,
            min: this.Min,
            max: this.Max,
            default_value: this.Default,
        }
    }

    private _value: number;
    public get Value(): number {
        return this._value;
    }
    public Increment(): void {
        if (this.Max) this._value = Math.min(this.Max, this._value + 1);
        else this._value = this._value + 1;
    }
    public Decrement(): void {
        if (this.Min) this._value = Math.max(this.Min, this._value - 1);
        else this._value = this._value - 1;
    }

    public Set(inputValue: number): void {
        if (typeof inputValue !== "number" || isNaN(inputValue)) return;
        let value = inputValue;
        if (this.Max) value = Math.min(this.Max, value);
        if (this.Min) value = Math.max(this.Min, value);
        this._value = value;
    }

    public Reset(): void {
        this._value = this.Default;
    }

    public SaveData(data: ICounterSaveData): ICounterSaveData {
        return {
            id: this.ID,
            val: this.Value,
        };
    }


    public LoadData(data: ICounterSaveData): void {
        this.Set(data.val);
    }
}
