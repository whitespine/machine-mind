import { RangeType } from "@src/enums";
import { SimSer } from "@src/registry";
import { Bonus, Mech, MechWeapon, MechWeaponProfile, WeaponMod } from "@src/class";
import { BonusSummary } from "@src/interface";

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface PackedRangeData {
    type: RangeType;
    val: number;
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

    public async emit(): Promise<PackedRangeData> {
        let parsed = parseInt(this.Value);
        return {
            type: this.RangeType,
            val: Number.isNaN(parsed) ? ((this.Value as unknown) as number) : parsed,
        };
    }

    public copy(): Range {
        return new Range(this.save());
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
        mech: Mech,
        mod?: WeaponMod
    ): Range[] {
        // Cut down to bonuses that affect ranges
        let all_bonuses = mech.AllBonuses.concat(mod?.Bonuses ?? []).filter(x => x.LID === "range");

        // Start building our output
        const output: Range[] = [];
        const ctx = mech.Pilot ? Bonus.ContextFor(mech.Pilot) : {};

        // Combine the ranges
        let base_ranges = profile.BaseRange;
        if (mod) {
            base_ranges = Range.CombineLists(base_ranges, mod.AddedRange);
        }

        for (let base_range of base_ranges) {
            // Further narrow down to bonuses to this specific range/weapon combo
            let range_specific_bonuses = all_bonuses.filter(b =>
                b.applies_to_weapon(weapon, profile, base_range)
            );

            // Compute them vals
            let bonus_summary: BonusSummary<number>;
            let base_as_num = parseInt(base_range.Value);
            let fallback_base: string; //
            if (Number.isNaN(base_as_num)) {
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

    // Undo the above conversion
    public static FlattenChecklist(ranges: RangeTypeChecklist): RangeType[] {
        return Object.keys(ranges).filter(r => ranges[r]) as RangeType[];
    }

    public static unpack(r: PackedRangeData): RegRangeData {
        return {
            type: r.type,
            val: "" + r.val,
        };
    }

    // Combine two arrays of damage. Does not edit originals
    public static CombineLists(a: Range[], b: Range[]): Range[] {
        // Make a copy of a.
        let result = a.map(d => d.copy());

        // For each b, try to find a matching a and add them together
        for (let db of b) {
            // Get a match on
            let to_be_modified = result.find(result_d => result_d.RangeType == db.RangeType);
            if (to_be_modified) {
                // We found existing damage of that type. Sum on the new stuff
                to_be_modified.Value += ` + ${db.Value}`;
            } else {
                // Did not already have that damage type. Add it
                result.push(db.copy());
            }
        }
        return result;
    }
}
