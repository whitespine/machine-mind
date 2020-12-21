import { Rules } from "@src/class";
import { SimSer } from "@src/registry";
import { Bonus } from "../Bonus";
import { HASE } from "../../enums";

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
        if (!Array.isArray(data)) {
            data = [0, 0, 0, 0];
        } else if (data.length != 4) {
            data.length = 4;
        }
        [this.Hull, this.Agi, this.Sys, this.Eng] = data;
    }

    public save(): IMechSkills {
        return [this.Hull, this.Agi, this.Sys, this.Eng];
    }

    // Get the bonuses imparted by these skills to mechs
    public get SkillBonuses(): Bonus[] {
        return [
            Bonus.generate("hp", this.Hull * 2).from_source("HULL"),
            Bonus.generate("repcap", Math.floor(this.Hull / 2)).from_source("HULL"),
            Bonus.generate("evasion", this.Agi).from_source("AGI"),
            Bonus.generate("speed", Math.floor(this.Agi / 2)).from_source("AGI"),
            Bonus.generate("edef", this.Sys).from_source("SYS"),
            Bonus.generate("tech_attack", this.Sys).from_source("SYS"),
            Bonus.generate("sp", Math.floor(this.Sys / 2)).from_source("SYS"),
            Bonus.generate("heatcap", this.Eng).from_source("ENG"),
            Bonus.generate("limited_bonus", Math.floor(this.Eng / 2)).from_source("SYS"),
        ];
    }

    // TODO: allow overrides by some mechanism. Alternatively, just tell emperor to have a -grit penalty to hp (actually that's way easier)
    // This is somewhat unrelated but felt a fitting place to put this. Bonuses from grit
    public static LevelBonuses: Bonus[] = [
        Bonus.generate("hp", "{grit}").from_source("Pilot GRIT"),
        Bonus.generate("sp", "{grit}").from_source("Pilot GRIT"),
        Bonus.generate("attack", "{grit}").from_source("Pilot GRIT"),
        Bonus.generate("save", "{grit}").from_source("Pilot GRIT"),
        Bonus.generate("cb_point", "floor({ll} / 3)").from_source("Pilot LEVEL / 3"),
        Bonus.generate("talent_point", "{ll}").from_source("Pilot LEVEL"),
        Bonus.generate("skill_point", "{ll}").from_source("Pilot LEVEL"),
        Bonus.generate("mech_skill_point", "{ll}").from_source("Pilot LEVEL"),
        Bonus.generate("license_point", "{ll}").from_source("Pilot LEVEL"),
    ];

    public static BaseBonuses: Bonus[] = [
        Bonus.generate("pilot_hp", Rules.BasePilotHP).from_source("Base HP"),
        Bonus.generate("skill_point", Rules.MinimumPilotSkills).from_source("Base Points"),
        Bonus.generate("mech_skill_point", Rules.MinimumMechSkills).from_source("Base Points"),
        Bonus.generate("talent_point", Rules.MinimumPilotTalents).from_source("Base Points"),
        Bonus.generate("ai_cap", 1).from_source("Base AI Cap"),
    ];

    public get AllBonuses(): Bonus[] {
        return [...this.SkillBonuses, ...MechSkills.LevelBonuses, ...MechSkills.BaseBonuses];
    }
}
