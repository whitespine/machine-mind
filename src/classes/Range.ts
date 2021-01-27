import { RangeType } from "../enums";
import { SimSer } from "@src/registry";
import { MechWeapon, MechWeaponProfile } from "./mech/MechWeapon";
import { Bonus, Mech } from "@src/class";
import { BonusSummary } from "./Bonus";

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface PackedRangeData {
    type: RangeType;
    val: number;
    override?: boolean;
    bonus?: number;
}

export interface RegRangeData {
    type: RangeType;
    val: string;
}

// Used to store things like what range-typed weapons a bonus affects
export type RangeTypeChecklist = { [key in RangeType]: boolean };

// Represents a single range for a weapon. Line 8, range 10, burst 2, etc. Blast will have a separate entry for its "normal" range and the range of the explosion
export class Range extends SimSer<RegRangeData> {
    RangeType!: RangeType;
    Value!: string;
    Bonuses?: string[]; // A purely visual attribute included in ranges produced by calc_range_with_bonuses. Describes the change

    public load(data: RegRangeData): void {
        this.RangeType = data.type;
        this.Value = data.val;
    }

    public save(): RegRangeData {
        return {
            type: this.RangeType,
            val: this.Value,
        };
    }

    public get Icon(): string {
        return Range.icon_for(this.RangeType);
    }

    public static icon_for(rt: RangeType): string {
        return `cci-${rt.toLowerCase()}`;
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

    // A simple text output. Perhaps unnecessary - kept from compcon
    public get Text(): string {
        if (this.Bonuses) return `${this.RangeType} ${this.Value} (+${this.Bonuses})`;
        return `${this.RangeType} ${this.Value}`;
    }

    // Gives the bonus-included ranges for the given mech weapon
    public static calc_range_with_bonuses(
        weapon: MechWeapon,
        profile: MechWeaponProfile,
        mech: Mech
    ): Range[] {
        // cut down to bonuses that affect ranges
        let all_bonuses = mech.AllBonuses.filter(x => x.ID === "range");

        // Start building our output
        const output: Range[] = [];
        const ctx = mech.Pilot ? Bonus.PilotContext(mech.Pilot) : {};
        for (let base_range of profile.BaseRange) {
            // Further narrow down to bonuses to this specific range/weapon combo
            let range_specific_bonuses = all_bonuses.filter(b =>
                b.applies_to_weapon(weapon, profile, base_range)
            );

            // Compute them vals
            let bonus_summary: BonusSummary;
            let base_as_num = parseInt(base_range.Value);
            let fallback_base: string; //
            if(Number.isNaN(base_as_num)) {
                fallback_base = base_range.Value + " + ";
                bonus_summary = Bonus.Accumulate(0, range_specific_bonuses, ctx);
            } else {
                fallback_base = "";
                bonus_summary = Bonus.Accumulate(base_as_num, range_specific_bonuses, ctx);
            }

            // Push the augmented range
            let new_range = new Range({
                type: base_range.RangeType,
                val: fallback_base + bonus_summary.final_value,
            });
            new_range.Bonuses = bonus_summary.contributors.map(
                b => `+${b.value} :: ${b.bonus.Title}`
            ); // TODO: make this format more cases, such as overwrites and replaces

            output.push(new_range);
        }
        return output;
    }

    // Convert a range type array to a checklist. If no range types provided, assume all
    public static MakeChecklist(ranges: RangeType[]): RangeTypeChecklist {
        let override = ranges.length == 0;
        return {
            Blast: override || ranges.includes(RangeType.Blast),
            Burst: override || ranges.includes(RangeType.Burst),
            Cone: override || ranges.includes(RangeType.Cone),
            Line: override || ranges.includes(RangeType.Line),
            Range: override || ranges.includes(RangeType.Range),
            Thrown: override || ranges.includes(RangeType.Thrown),
            Threat: override || ranges.includes(RangeType.Threat),
        };
    }

    public static unpack(r: PackedRangeData): RegRangeData {
        return {
            type: r.type,
            val: ""+r.val
        }
    }
}
