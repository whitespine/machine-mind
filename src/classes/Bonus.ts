import { Mech, Npc, Pilot } from "@src/class";
import { BonusDict, BonusList } from "./BonusDict";
import { DamageType, RangeType, WeaponSize, WeaponType } from "../enums";
import { SerUtil, SimSer } from "@src/registry";
import * as filtrex from "filtrex";
import { MechWeapon, MechWeaponProfile } from "./mech/MechWeapon";
import { Range } from "./Range";

export interface IBonusData {
    id: string;
    val: string | number;
    damage_types?: DamageType[];
    range_types?: RangeType[];
    weapon_types?: WeaponType[];
    weapon_sizes?: WeaponSize[];

    // ugh
    overwrite?: boolean;
    replace?: boolean;
}

interface BonusSummaryItem {
    bonus: Bonus; // The bonus that contributed this item
    value: number; // The computed result of the bonus
    included: boolean; // True if this value was actually included (false in cases of overwrites, or in the case of the base item being replaced)
}

export interface BonusSummary {
    base_value: number; // Self descriptive. Dropped in favor of base_replacements should base_replacements exist
    base_replacements: BonusSummaryItem[] | null;
    final_value: number; // What number should be used when all is said and done
    replace: boolean; // Whether replacement logic item(s) overrode the base
    overwrite: boolean; // Whether override logic overrode all other logic. 
    contributors: BonusSummaryItem[]; // All the contributing bonuses, included or no, used to tabulate this value. Doesn't include replacements
}

// Maps things like ll to the value we expect. Missing values are assumed to be zero
export interface BonusContext {
    [key: string]: number
}

export class Bonus {
    // We don't extend simser {
    ID!: string;
    Title!: string | number;
    Detail!: string | number;
    DamageTypes!: DamageType[];
    RangeTypes!: RangeType[];
    WeaponTypes!: WeaponType[];
    WeaponSizes!: WeaponSize[];
    Overwrite!: boolean;
    Replace!: boolean;


    // Cached compiled thingies
    private _value!: string | number;
    private _value_func!: (v: BonusContext) => number;

    // A transient value used for further display information
    Source: string;

    public constructor(data: IBonusData, source: string) {
        this.ID = data.id;
        this.Value = data.val;
        this.DamageTypes = data.damage_types ?? []; // We much prefer these just be empty
        this.RangeTypes = data.range_types ?? [];
        this.WeaponTypes = data.weapon_types ?? [];
        this.WeaponSizes = data.weapon_sizes ?? [];
        this.Overwrite = data.overwrite ?? false;
        this.Replace = data.replace ?? false;

        // Set our source if need be
        this.Source = source;

        // Check for more metadata.
        const entry = BonusDict.get(data.id);
        this.Title = entry ? entry.title : "UNKNOWN BONUS";
        this.Detail = entry ? this.parse_detail(entry.detail) : "UNKNOWN BONUS";
    }

    // Compile the expression
    public set Value(new_val: string | number) {
        this._value = new_val;

        // Replace any {} surrounded value with a default-substituting equivalent. {ll} -> (ll or 0)
        let val = "" + this.Value;
        val = val.replace(/\{(.*?)\}/g, "($1 or 0)")
        try {
            this._value_func = filtrex.compileExpression(val);
        } catch (e) {
            this._value_func = x => 666;
        }
    }

    public get Value(): string | number {
        return this._value;
    }

    // Just a more convenient constructor
    public static generate(id: string, val: string | number, source: string): Bonus {
        return new Bonus({ id, val }, source);
    }

    public save(): IBonusData {
        return {
            id: this.ID,
            val: this.Value,
            damage_types: SerUtil.drop_empty(this.DamageTypes),
            range_types: SerUtil.drop_empty(this.RangeTypes),
            weapon_types: SerUtil.drop_empty(this.WeaponTypes),
            weapon_sizes: SerUtil.drop_empty(this.WeaponSizes),
            overwrite: this.Overwrite,
            replace: this.Replace
        };
    }

    // Formats our detail string to properly show weapon types, damage types, value, etc
    private parse_detail(str: string): string {
        str = str.replace(/{VAL}/g, "" + this.Value);
        str = str.replace(/{INC_DEC}/g, this.Value > -1 ? "Increases" : "Decreases");
        str = str.replace(
            /{RANGE_TYPES}/g,
            ` ${this.RangeTypes.length ? this.RangeTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{DAMAGE_TYPES}/g,
            ` ${this.DamageTypes.length ? this.DamageTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{WEAPON_TYPES}/g,
            ` ${this.WeaponTypes.length ? this.WeaponTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{WEAPON_SIZES}/g,
            ` ${this.WeaponSizes.length ? this.WeaponSizes.join("/").toUpperCase() : ""}`
        );

        return str;
    }

    // For npcs
    public evaluate_tier(number: number): number {
        return 0;
    }

    // Quickly check if a weapon qualifies for this bonus. We accept a range because multiple ranges are typically discreet, whereas damages are pooled
    public applies_to_weapon(
        weapon: MechWeapon,
        profile: MechWeaponProfile,
        range: Range
    ): boolean {
        // Check type
        if (this.WeaponTypes.length && !this.WeaponTypes.some(wt => profile.WepType === wt)) {
            return false; // Does not apply - wrong type
        }

        // Check size
        if (this.WeaponSizes.length && !this.WeaponSizes.some(ws => weapon.Size === ws)) {
            return false; // Does not apply - wrong size
        }

        // Check damage type
        if (
            this.DamageTypes.length &&
            !this.DamageTypes.some(dt => profile.BaseDamage.some(x => x.DamageType === dt))
        ) {
            return false; // Does not apply - wrong damage type
        }

        // Check range type
        if (this.RangeTypes.length && this.RangeTypes.some(rt => range.RangeType === rt)) {
            return false; // Does not apply - wrong range type
        }

        return true;
    }

    // Generates a context for a given pilot
    public static PilotContext(pilot: Pilot): BonusContext {
        return {
            "ll": pilot.Level,
            "grit": pilot.Grit
        }
    }


    // The canonical way to sum bonuses. Includes logic for handling the "overwrite" and "replace" flags
    public static Accumulate(base_value: number, bonuses: Bonus[], context: BonusContext): BonusSummary {
        // Init with some generic values
        let result: BonusSummary = {
            base_value: base_value,
            base_replacements: null,
            contributors: [],
            final_value: 0,
            overwrite: false,
            replace: false
        };

        // Groups
        let norm: BonusSummaryItem[] = [];
        let repl: BonusSummaryItem[] = [];
        let over: BonusSummaryItem[] = [];
        let over_repl: BonusSummaryItem[] = [];

        // Process initial 
        for(let b of bonuses) {
            let as_item: BonusSummaryItem = {
                bonus: b,
                included: true, // We mark false as appropriate later
                value: b._value_func(context)
            }

            // Update flags
            result.overwrite ||= b.Overwrite;
            result.replace ||= b.Replace;

            // Categorize appropriately
            if(b.Replace && b.Overwrite) {
                over_repl.push(as_item);
            } else if(b.Replace) {
                repl.push(as_item);
            } else if(b.Overwrite) {
                over.push(as_item);
            } else {
                norm.push(as_item);
            }
        }

        // Decide total and mark included
        if(over_repl.length) {
            // Everything in non-over-repl is not used
            norm.forEach(x => x.included = false);
            over.forEach(x => x.included = false);
            repl.forEach(x => x.included = false);

            // Find the max - make all others not included
            over_repl.forEach(x => x.included = false);
            let highest = find_max(over_repl)!;
            highest.included = true;
            result.final_value = highest.value;
        } else {
            // We aren't just nuking everything in favor of a single item
            let contrib = 0;
            let base = base_value;

            // Handle if we have one or more replaces
            if(repl.length) {
                // Re-compute base by summing the replaces
                base = 0;
                for(let r of repl) {
                    base += r.value;                    
                }
            }

            // Handle if we have one or more overwrites
            if(over.length) {
                // Only over will be counted here. We nuke all other non-replace contribs
                norm.forEach(x => x.included = false);
                over.forEach(x => x.included = false);
                let highest = find_max(over)!;
                highest.included = true;
                contrib = highest.value;
            } else {
                // If we have no overwrites then we still need to sum up contribs
                for(let c of norm) {
                    contrib += c.value;
                }
            }

            // Set the final by summing the above two
            result.final_value = base + contrib;
        }


        // Add all the items regardless
        result.contributors = [...norm, ...over];
        if(repl.length || over_repl.length) {
            result.base_replacements = [...repl, ...over_repl];
        }
        return result;
    }
}

// Find highest valued item of provided array
function find_max(items: BonusSummaryItem[]): BonusSummaryItem | null {
    let highest_val = 0;
    let highest: BonusSummaryItem | null = null;
    for(let v of items) {
        if(v.value > highest_val) {
            highest = v;
            highest_val = v.value;
        }
    }
    return highest;
}