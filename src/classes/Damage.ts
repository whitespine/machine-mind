import { SerUtil, SimSer } from "@src/registry";
import * as pmath from "parsemath";
import { DamageType } from "./enums";

//TODO: getDamage(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface PackedDamageData {
    type: DamageType;
    val: string | number;
    override?: boolean; // If player can set the damage of this, I guess????
}

export interface RegDamageData {
    type: DamageType;
    val: string; // We always want it to be dicey!
}

export class Damage extends SimSer<RegDamageData> {
    DamageType!: DamageType;
    Value!: string;
    // RawValue: string | number; -- we don't really case. We're just going to parse them all into a string. if someone gives us trash then they can frig off
    // Override: boolean; - this is encapsulated by the fact

    // Methods / getters
    // Computes the maximum damage of this weapon (e.g. for brutal)

    // Vaarious formatting options
    get Icon(): string {
        return `cci-${this.DamageType.toLowerCase()}`;
    }

    get Text(): string {
        return `${this.Value} ${this.DamageType} Damage`;
    }

    DiscordEmoji(): string {
        return `:cc_damage_${this.DamageType.toLowerCase()}:`;
    }
    Color(): string {
        return `damage--${this.DamageType.toLowerCase()}`;
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

    public static unpack(dat: PackedDamageData): RegDamageData {
        return {
            type: dat.type,
            val: "" + dat.val,
        };
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
