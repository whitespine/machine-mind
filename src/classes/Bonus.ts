import { Damage, Mech, MechWeapon, Npc, Pilot, Range} from "@src/class";
import { BonusDict } from "./BonusDict";
import { DamageType, RangeType, WeaponSize, WeaponType } from "@src/enums";
import { EntryType, SerUtil, SimSer } from "@src/registry";
import * as filtrex from "filtrex";
import { DamageTypeChecklist, RangeTypeChecklist, WeaponSizeChecklist, WeaponTypeChecklist } from "@src/interface";
import { defaults, list_truthy_keys } from "@src/funcs";
import { MechWeaponProfile } from "@src/class";
import { merge_defaults } from "./default_entries";

export interface PackedBonusData {
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

// Make all fields required, force val to string, and use checklists
export interface RegBonusData {
    lid: string;
    val: string;
    damage_types: DamageTypeChecklist;
    range_types: RangeTypeChecklist;
    weapon_types: WeaponTypeChecklist;
    weapon_sizes: WeaponSizeChecklist;

    overwrite: boolean;
    replace: boolean;
}

interface BonusSummaryItem<T extends string | number> {
    bonus: Bonus; // The bonus that contributed this item
    value: T; // The computed result of the bonus
    included: boolean; // True if this value was actually included (false in cases of overwrites, or in the case of the base item being replaced)
}

export interface BonusSummary<T extends string | number> {
    base_value: T; // Self descriptive. Dropped in favor of base_replacements should base_replacements exist
    base_replacements: BonusSummaryItem<T>[] | null; 
    final_value: T; // What number should be used when all is said and done
    replace: boolean; // Whether replacement logic item(s) overrode the base
    overwrite: boolean; // Whether override logic overrode all other logic. 
    contributors: BonusSummaryItem<T>[]; // All the contributing bonuses, included or no, used to tabulate this value. Doesn't include replacements
}

// Maps things like ll to the value we expect. Missing values are assumed to be zero
export interface BonusContext {
    [key: string]: number
}

export class Bonus extends SimSer<RegBonusData> {
    LID!: string;
    Title!: string;
    Detail!: string;
    DamageTypes!: DamageTypeChecklist;
    RangeTypes!: RangeTypeChecklist;
    WeaponTypes!: WeaponTypeChecklist;
    WeaponSizes!: WeaponSizeChecklist;
    Overwrite!: boolean;
    Replace!: boolean;

    // Cached compiled thingies
    private _value!: string;
    private num_value_func!: (v: BonusContext) => number; // Tries to produce strings
    private str_value_func!: (v: BonusContext) => string; // Tries to produce numbers

    // An ephemeral label
    Source: string = "???";

    // A self returning func for easily setting the source
    public from_source(src: string): Bonus {
        this.Source = src;
        return this;
    }

    public load(data: RegBonusData) {
        merge_defaults(data, defaults.BONUS());
        this.LID = data.lid;
        this.Value = data.val;
        this.DamageTypes = data.damage_types;
        this.RangeTypes = data.range_types;
        this.WeaponTypes = data.weapon_types;
        this.WeaponSizes = data.weapon_sizes;
        this.Overwrite = data.overwrite;
        this.Replace = data.replace;

        // Check for more metadata from our list/map of implemented bonus data
        const entry = BonusDict.get(data.lid);
        this.Title = entry ? entry.title : "UNKNOWN BONUS";
        this.Detail = entry ? this.parse_detail(entry.detail) : "UNKNOWN BONUS";
    }

    public static unpack(data: PackedBonusData): RegBonusData {
        return merge_defaults({
            lid: data.id,
            val: "" + data.val,
            damage_types: Damage.MakeChecklist(data.damage_types ?? []),
            range_types: Range.MakeChecklist(data.range_types ?? []),
            weapon_sizes: MechWeapon.MakeSizeChecklist(data.weapon_sizes ?? []),
            weapon_types: MechWeapon.MakeTypeChecklist(data.weapon_types ?? [])
        }, defaults.BONUS());
    }

    // Compile the expression
    public set Value(new_val: string) {
        this._value = ""+new_val;

        // Replace any {} surrounded value with a default-substituting equivalent. {ll} -> (ll or 0)
        let val = "" + this.Value;
        val = val.replace(/\{(.*?)\}/g, "($1 or 0)")

        // Then compile
        try {
            this.str_value_func = filtrex.compileExpression(val);
            this.num_value_func = filtrex.compileExpression(val);
        } catch (e) {
            this.str_value_func = x => ""; // An error expression - just zero it
            this.num_value_func = x => 0; // An error expression - just blank it
        }
    }

    public get Value(): string {
        return this._value;
    }

    // Just a more convenient constructor
    public static generate(lid: string, val: string | number, replace: boolean = false, overwrite: boolean = false): Bonus {
        return new Bonus({
            ...defaults.BONUS(), 
            lid, 
            val: "" + val,
            replace,
            overwrite
        });
    }

    public save(): RegBonusData {
        return {
            lid: this.LID,
            val: this.Value,
            damage_types: {...this.DamageTypes}, 
            range_types: {...this.RangeTypes},
            weapon_types: {...this.WeaponTypes},
            weapon_sizes: {...this.WeaponSizes},
            overwrite: this.Overwrite,
            replace: this.Replace
        };
    }

    // Formats our detail string to properly show weapon types, damage types, value, etc
    private parse_detail(str: string): string {
        let parsed = parseInt(this.Value);
        let mod = isNaN(parsed) ? "Modifies" : parsed < 0 ? "Decreases" : "Increases";
        str = str.replace(/{VAL}/g, "" + this.Value);
        str = str.replace(/{INC_DEC}/g, mod);
        str = str.replace(/{RANGE_TYPES}/g, list_truthy_keys(this.RangeTypes).join("/"));
        str = str.replace(/{DAMAGE_TYPES}/g, list_truthy_keys(this.DamageTypes).join("/"));
        str = str.replace(/{WEAPON_TYPES}/g, list_truthy_keys(this.WeaponTypes).join("/"));
        str = str.replace(/{WEAPON_SIZES}/g, list_truthy_keys(this.WeaponSizes).join("/"));

        return str;
    }

    // Formats our detail string further with a pilot context
    /*
    public contextualized_detail(ctx: BonusContext): string {
        let s = this.Detail;
        for(let key of Object.keys(ctx)) {
            s = s.
        }

    }
    */

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
        if (!this.WeaponTypes[profile.WepType]) {
            return false; // Does not apply - wrong type
        }

        // Check size
        if (!this.WeaponSizes[weapon.Size]) {
            return false; // Does not apply - wrong size
        }

        // Check damage type. Basically just check intersection of our damage type keys with
        if(!profile.BaseDamage.some(bd => this.DamageTypes[bd.DamageType])) {
            return false; // Does not apply - wrong damage type
        }

        // Check range type. Would be same deal, but we typically want to check for specific ranges
        if (!this.RangeTypes[range.RangeType]) {
            return false; // Does not apply - wrong range type
        }

        return true;
    }

    // Generates a context for a given pilot
    public static ContextFor(unit: Pilot | Mech | Npc | null): BonusContext {
        if(unit?.Type == EntryType.PILOT) {
            return {
                "ll": unit.Level,
                "grit": unit.Grit
            }
        } else if(unit?.Type == EntryType.MECH) {
            if(unit.Pilot) {
                return {
                    "ll": unit.Pilot.Level,
                    "grit": unit.Pilot.Grit
                }
            }
        } else if(unit?.Type == EntryType.NPC) {
            return {
                "tier": unit.Tier,
            }
        } 

        // Default to having nothing.
        return {};
    }


    // The canonical way to sum bonuses. Includes logic for handling the "overwrite" and "replace" flags
    public static Accumulate<T extends number | string>(base_value: T, bonuses: Bonus[], context: BonusContext): BonusSummary<T> {
        let start: T;
        let is_string: boolean;
        if(typeof base_value == "string") {
            start = "" as T;
            is_string = true;
        } else {
            start = 0 as T;
            is_string = false;
        }

        // Init with some generic values
        let result: BonusSummary<T> = {
            base_value: base_value,
            base_replacements: null,
            contributors: [],
            final_value: start,
            overwrite: false,
            replace: false
        };

        // Groups
        let norm: BonusSummaryItem<T>[] = [];
        let repl: BonusSummaryItem<T>[] = [];
        let over: BonusSummaryItem<T>[] = [];
        let over_repl: BonusSummaryItem<T>[] = [];

        // Process initial 
        for(let b of bonuses) {
            let value: T;
            if(is_string) {
                value = b.str_value_func(context) as T;
            } else {
                value = b.num_value_func(context) as T;
            }
            let as_item: BonusSummaryItem<T> = {
                bonus: b,
                included: true, // We mark false as appropriate later
                value
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
            let contrib_bonuses: T = (is_string ? "" : 0) as T; // All the +'s totaled up
            let base = base_value;

            // Handle if we have one or more replaces. Need to replace `base` with the sum of them
            if(repl.length) {
                // Re-compute base by summing the replaces
                if(is_string) {
                    let new_base = "";
                    for(let r of repl) {
                        if(new_base && r.value) {
                            new_base += " + ";
                        }
                        new_base += r.value as string;
                    }
                    base = new_base as T;
                } else {
                    let new_base = 0;
                    for(let r of repl) {
                        new_base += r.value as number;
                    }
                    base = new_base as T;
                }
            }

            // Handle if we have one or more overwrites. Need to replace `contribu_bonuses` with the highest of them
            if(over.length) {
                // Only over will be counted here. We nuke all other non-replace contribs
                norm.forEach(x => x.included = false);
                over.forEach(x => x.included = false);
                let highest = find_max(over)!;
                highest.included = true;
                contrib_bonuses = highest.value;
            } else {
                // If we have no overwrites then we still need to sum up contribs
                if(is_string) {
                    let new_contrib = "";
                    for(let c of norm) {
                        if(new_contrib && c.value) {
                            new_contrib += " + ";
                        }
                        new_contrib += c.value as string;
                    }
                    contrib_bonuses = new_contrib as T;
                } else {
                    let new_contrib = 0;
                    for(let c of norm) {
                        new_contrib += c.value as number;
                    }
                    contrib_bonuses = new_contrib as T;
                }
            }

            // Set the final by summing the above two
            if(is_string) {
                result.final_value = (contrib_bonuses ? `${base} + ${contrib_bonuses}` : `${base}`) as T;
            } else {
                result.final_value = ((base as number) + (contrib_bonuses as number)) as T;
            }
        }


        // Add all the items regardless
        result.contributors = [...norm, ...over];
        if(repl.length || over_repl.length) {
            result.base_replacements = [...repl, ...over_repl];
        }
        return result;
    }


    public async emit(): Promise<PackedBonusData> {
        return {
            id: this.LID,
            val: this.Value,
            damage_types: Damage.FlattenChecklist(this.DamageTypes),
            range_types: Range.FlattenChecklist(this.RangeTypes),
            overwrite: this.Overwrite,
            replace: this.Replace,
            weapon_sizes: MechWeapon.FlattenSizeChecklist(this.WeaponSizes),
            weapon_types: MechWeapon.FlattenTypeChecklist(this.WeaponTypes)
        }
    }
}

// Find highest valued item of provided array. Used for overrides
function find_max<T extends string | number>(items: BonusSummaryItem<T>[]): BonusSummaryItem<T> | null {
    let highest_val = 0;
    let highest: BonusSummaryItem<T> | null = null;
    for(let raw_v of items) {
        let val: number;
        if(typeof raw_v.value == "string") {
            val = Number.parseInt(raw_v.value) || 0;
        } else {
            val = raw_v.value as number;
        }

        if(val > highest_val) {
            highest = raw_v;
            highest_val = val;
        }
    }
    return highest;
}