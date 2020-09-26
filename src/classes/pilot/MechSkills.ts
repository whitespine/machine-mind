import { Rules, HASE } from "@/class";
import { store } from "@/hooks";
import { ident, MixBuilder, Mixlet, MixLinks } from '@/mixmeta';

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

export function CreateMechSkills(data: IMechSkills) {
    let mb = new MixBuilder<MechSkills, IMechSkills>({
        Increment, Decrement, Reset, Sum
    });
    mb.with(new Mixlet("Hull", 0, 0, ident, ident));
    mb.with(new Mixlet("Agi", 1, 0, ident, ident));
    mb.with(new Mixlet("Sys", 2, 0, ident, ident));
    mb.with(new Mixlet("Eng", 3, 0, ident, ident));
    return mb.finalize(data);
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
}
