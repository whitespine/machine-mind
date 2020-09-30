import { DamageType } from "@/class";
import { ident, MixBuilder, RWMix, MixLinks } from "@/mixmeta";
import * as pmath from "parsemath";

//TODO: getDamage(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface IDamageData {
    type: DamageType;
    val: string | number;
    override?: boolean ; // If player can set the damage of this, I guess????
}

export interface Damage extends MixLinks<IDamageData> {
    Type: DamageType;
    Value: string;
    // RawValue: string | number; -- we don't really case. We're just going to parse them all into a string. if someone gives us trash then they can frig off
    Override: boolean;

    // Methods / getters
    // Computes the maximum damage of this weapon (e.g. for brutal)
    Max(): number;

    // Vaarious formatting options
    Icon(): string;
    Text(): string;
    DiscordEmoji(): string;
    Color(): string;
}

export function CreateDamage(data: IDamageData): Damage {
    let mb = new MixBuilder<Damage, IDamageData>({
        Icon,
        Text,
        DiscordEmoji,
        Color,
        Max,
    });
    // Add our props
    mb.with(new RWMix("Type", "type", DamageType.Variable, getDamageType, ident));
    mb.with(new RWMix("Value", "val", "1", x => "" + x, ident)); // Coerce to strings on way in
    mb.with(new RWMix("Override", "override", false, ident, ident)); // We assume not overridden

    let rv = mb.finalize(data);
    return rv;
}

function getDamageType(str?: string ): DamageType {
    switch (str?.toLowerCase()) {
        case "kinetic":
            return DamageType.Kinetic;
        case "energy":
            return DamageType.Energy;
        case "explosive":
            return DamageType.Explosive;
        case "heat":
            return DamageType.Heat;
        case "burn":
            return DamageType.Burn;
    }
    return DamageType.Variable;
}

//TODO: replace with dicemath (PS: This is a beef todo. I dunno what it means
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

function Icon(this: Damage): string {
    return `cci-${this.Type.toLowerCase()}`;
}

function DiscordEmoji(this: Damage): string {
    return `:cc_damage_${this.Type.toLowerCase()}:`;
}

function Color(this: Damage): string {
    return `damage--${this.Type.toLowerCase()}`;
}

function Text(this: Damage): string {
    if (this.Override) return this.Value;
    return `${this.Value} ${this.Type} Damage`;
}

export const DamagesMixReader = (x: IDamageData[]  | undefined) => (x || []).map(CreateDamage);
export const DamagesMixWriter = (x: Damage[]) => x.map(i => i.Serialize());
