import { Rules } from "@/class";
import { ident, MixBuilder, RWMix, MixLinks, defn } from '@/mixmeta';
import { HASE } from '../enums';
import { Registry } from '../registry';

// It's HASE, baby!

export type IMechSkills = [number, number, number, number];

export interface MechSkills  extends MixLinks<IMechSkills>{
    Hull: number;
    Agi: number;
    Sys: number;
    Eng: number;

    // Methods
    // Add one to specified skill
    Increment(field: HASE): void;
    // Sub one to specified skill
    Decrement(field: HASE): void;
    // Reset all skills to zero
    Reset(): void ;
    // Add all skills
    Sum(): number;
}

export function CreateMechSkills(data: IMechSkills | null, ctx: Registry) {
    let mb = new MixBuilder<MechSkills, IMechSkills>({
        Increment, Decrement, Reset, Sum
    });
    mb.with(new RWMix("Hull", 0, defn(0), ident));
    mb.with(new RWMix("Agi", 1, defn(0), ident));
    mb.with(new RWMix("Sys", 2, defn(0), ident));
    mb.with(new RWMix("Eng", 3, defn(0), ident));
    return mb.finalize(data, ctx);
}


function Increment(this: MechSkills, field: HASE): void {
    if (this[field] < Rules.MaxHase) this[field] += 1;
}

function Decrement(this: MechSkills, field: HASE): void {
    if (this[field] > 0) this[field] -= 1;
}

function Reset(this: MechSkills): void {
    this.Hull = 0;
    this.Agi = 0;
    this.Sys = 0;
    this.Eng = 0;
}

function Sum(this: MechSkills): number {
    return this.Hull + this.Agi + this.Sys + this.Eng;
}
