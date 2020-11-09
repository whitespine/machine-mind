import { Rules } from "@/class";
import { SimSer } from "@/registry";
import { Bonus } from "../Bonus";
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

    public load(data: IMechSkills): void {
        [this.Hull, this.Agi, this.Sys, this.Eng] = data;
    }

    public save(): IMechSkills {
        return [this.Hull, this.Agi, this.Sys, this.Eng];
    }

    // Get the bonuses imparted by these skills to mechs
    public get SkillBonuses(): Bonus[] {
        return [
            Bonus.generate("hp", this.Hull, "HULL"),
            Bonus.generate("repcap", Math.floor(this.Hull / 2), "HULL"),
            Bonus.generate("evasion", this.Agi, "AGI"),
            Bonus.generate("speed", Math.floor(this.Agi / 2), "AGI"),
            Bonus.generate("edef", this.Sys, "SYS"),
            Bonus.generate("tech_attack", this.Sys, "SYS"),
            Bonus.generate("sp", Math.floor(this.Sys / 2), "SYS"),
            Bonus.generate("heatcap", this.Eng, "ENG"),
            Bonus.generate("limited_bonus", Math.floor(this.Eng / 2), "SYS"),
        ];
    }

    // TODO: allow overrides by some mechanism. Alternatively, just tell emperor to have a -grit penalty to hp (actually that's way easier)
    // This is somewhat unrelated but felt a fitting place to put this. Bonuses from grit
    public static LevelBonuses: Bonus[] = [
        Bonus.generate("hp", "{grit}", "Pilot GRIT"),
        Bonus.generate("sp", "{grit}", "Pilot GRIT"),
        Bonus.generate("attack", "{grit}", "Pilot GRIT"),
        Bonus.generate("save", "{grit}", "Pilot GRIT"),
        Bonus.generate("cb_point", "floor({ll} / 3)", "Pilot LEVEL / 3"),
        Bonus.generate("talent_point", "{ll}", "Pilot LEVEL"),
        Bonus.generate("skill_point", "{ll}", "Pilot LEVEL"),
        Bonus.generate("mech_skill_point", "{ll}", "Pilot LEVEL"),
        Bonus.generate("license_point", "{ll}", "Pilot LEVEL"),
    ];

    public static BaseBonuses: Bonus[] = [
        Bonus.generate("hp", Rules.BasePilotHP, "Base HP"),
        Bonus.generate("skill_point", Rules.MinimumPilotSkills, "Base Points"),
        Bonus.generate("mech_skill_point", Rules.MinimumMechSkills, "Base Points"),
        Bonus.generate("talent_point", Rules.MinimumPilotTalents, "Base Points"),
        Bonus.generate("ai_cap", 1, "Base AI Cap"),
    ];

    public get AllBonuses(): Bonus[] {
        return [...this.SkillBonuses, ...MechSkills.LevelBonuses, ...MechSkills.BaseBonuses];
    }
}
