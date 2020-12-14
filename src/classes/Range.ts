import { RangeType } from "../enums";
import { SimSer } from "@src/registry";
import { MechWeapon, MechWeaponProfile } from "./mech/MechWeapon";
import { Bonus, Mech } from "@src/class";

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface PackedRangeData {
    type: RangeType;
    val: number;
    override?: boolean;
    bonus?: number;
}

export interface RegRangeData {
    type: RangeType;
    val: number;
}

export class Range extends SimSer<RegRangeData> {
    RangeType!: RangeType;
    Value!: number;
    Bonuses?: string[]; // A purely visual attribute included in ranges produced by calc_range_with_bonuses. Describes the change

    public load(data: PackedRangeData): void {
        this.RangeType = data.type;
        this.Value = data.val;
    }

    public save(): PackedRangeData {
        return {
            type: this.RangeType,
            val: this.Value,
        };
    }

    public get Icon(): string {
        return `cci-${this.RangeType.toLowerCase()}`;
    }

    public get DiscordEmoji(): string {
        return Range.discord_emoji_for(this.RangeType);
    }

    // Returns the discord emoji corresponding to the provided range type
    public static discord_emoji_for(rt: RangeType): string {
        switch (rt) {
            case RangeType.Range:
            case RangeType.Threat:
            case RangeType.Thrown:
                return `:cc_${rt.toLowerCase()}:`;
        }
        return `:cc_aoe_${rt.toLowerCase()}:`;
    }

    public get Text(): string {
        if (this.Bonuses) return `${this.RangeType} ${this.Value} (+${this.Bonuses})`;
        return `${this.RangeType} ${this.Value}`;
    }

    // Checks if the given bonus can affect this range
    public can_bonus_apply(b: Bonus) {
        return b.RangeTypes.includes(this.RangeType);
    }

    // Gives the bonus-included ranges for the given mech weapon
    public static calc_range_with_bonuses(weapon: MechWeapon, profile: MechWeaponProfile, mech: Mech): Range[] {
        const bonuses = mech.AllBonuses.filter(x => x.ID === "range");
        const output: Range[] = [];
        const ctx = mech.Pilot ? Bonus.PilotContext(mech.Pilot) : {};
        for(let base_range of profile.BaseRange) {
            let bonus_summary = Bonus.Accumulate(base_range.Value, bonuses, ctx);

            // Push the augmented range
            let new_range = new Range({
                type: base_range.RangeType,
                val: bonus_summary.final_value
            });
            new_range.Bonuses = bonus_summary.contributors.map(b => `+${b.value} :: ${b.bonus.Title}`); // TODO: make this format more cases, such as overwrites and replaces

            output.push(new_range);
        }
        return output;
    }
}
