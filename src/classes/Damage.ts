import { SerUtil, SimSer } from "@src/registry";
import { DamageType } from "@src/enums";

export interface PackedDamageData {
    type: DamageType;
    val: string | number;
    override?: boolean; // If player can set the damage of this, I guess????
}

export interface RegDamageData {
    type: DamageType;
    val: string; // We always want it to be dicey!
}

// Used to store things like what damage types a bonus affects
export type DamageTypeChecklist = { [key in DamageType]: boolean };

export class Damage extends SimSer<RegDamageData> {
    DamageType!: DamageType;
    Value!: string;

    // Methods / getters
    // Computes the maximum damage of this weapon (e.g. for brutal)

    // Various formatting options
    get Icon(): string {
        return Damage.icon_for(this.DamageType);
    }

    // Returns the css font icon corresponding to the provided damage type
    public static icon_for(dt: DamageType): string {
        return `cci-${dt.toLowerCase()}`;
    }

    get Text(): string {
        return `${this.Value} ${this.DamageType} Damage`;
    }

    get DiscordEmoji(): string {
        return Damage.discord_emoji_for(this.DamageType);
    }

    // Returns the discord emoji corresponding to the provided damage type
    public static discord_emoji_for(dt: DamageType): string {
        return `:cc_damage_${dt.toLowerCase()}:`;
    }

    get Color(): string {
        return Damage.color_for(this.DamageType);
    }

    // Returns the css color name corresponding to the provided damage type
    public static color_for(dt: DamageType): string {
        return `damage--${dt.toLowerCase()}`;
    }

    public load(data: RegDamageData): void {
        this.DamageType = SerUtil.restrict_enum(DamageType, DamageType.Kinetic, data.type);
        this.Value = "" + data.val;
    }

    public save(): RegDamageData {
        return {
            type: this.DamageType,
            val: this.Value,
        };
    }

    public copy(): Damage {
        return new Damage(this.save());
    }

    public static unpack(dat: PackedDamageData): RegDamageData {
        return {
            type: dat.type,
            val: "" + dat.val,
        };
    }

    // Convert a damage type array to a checklist. If no damage types provided, assume all
    public static MakeChecklist(damages: DamageType[]): DamageTypeChecklist {
        let override = damages.length == 0;
        return {
            Burn: override || damages.includes(DamageType.Burn),
            Energy: override || damages.includes(DamageType.Energy),
            Explosive: override || damages.includes(DamageType.Explosive),
            Heat: override || damages.includes(DamageType.Heat),
            Kinetic: override || damages.includes(DamageType.Kinetic),
            Variable: override || damages.includes(DamageType.Variable),
        };
    }

    // Combine two arrays of damage. Does not edit originals
    public static CombineLists(a: Damage[], b: Damage[]): Damage[] {
        // Make a copy of a.
        let result = a.map(d => d.copy());

        // For each b, try to find a matching a and add them together
        for (let db of b) {
            // Get a match on
            let to_be_modified = result.find(result_d => result_d.DamageType == db.DamageType);
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

//TODO: replace with dicemath (PS: This is a beef todo. I dunno what it means
/*
function Max(this: Damage): number {
    // Most trivial way to do this is to just make ever "d" a "*" then eval. So we do that, for the time being
    let max_formula = this.Value.replaceAll("d", "*");

    // Return 0 on fail
    try {
        return pmath.parse(max_formula);
    } catch (e) {
        return 0;
    }
}

*/
