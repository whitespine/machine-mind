import { Rules } from "@/class";
import { SimSer } from "@/registry";
import { HASE } from "../enums";

// It's HASE, baby!

export type IMechSkills = [number, number, number, number];

export class MechSkills extends SimSer<IMechSkills> {
    Hull!: number;
    Agi!: number;
    Sys!: number;
    Eng!: number;

    // Add one to specified skill
    public Increment(field: HASE): void {
        if (this[field] < Rules.MaxHase) this[field] += 1;
    }

    // Sub one to specified skill
    public Decrement(field: HASE): void {
        if (this[field] > 0) this[field] -= 1;
    }

    // Reset all skills to zero
    public Reset(): void {
        this.Hull = 0;
        this.Agi = 0;
        this.Sys = 0;
        this.Eng = 0;
    }

    // Add all skills
    public get Sum(): number {
        return this.Hull + this.Agi + this.Sys + this.Eng;
    }

    protected load(data: IMechSkills): void {
        [this.Hull, this.Agi, this.Sys, this.Eng] = data;
    }

    public save(): IMechSkills {
        return [this.Hull, this.Agi, this.Sys, this.Eng];
    }
}
