import { ident, MixBuilder, RWMix, MixLinks,defb, def_empty_map  } from "@/mixmeta";
import { SimSer } from '@/new_meta';
import * as pmath from "parsemath";
import { DamageType } from './enums';

//TODO: getDamage(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface IDamageData {
    type: DamageType;
    val: string | number;
    override?: boolean; // If player can set the damage of this, I guess????
}

export class Damage extends SimSer<IDamageData> {
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

    
    protected load(data: IDamageData): void {
        this.DamageType = restrict_enum(DamageType, DamageType.Kinetic, data.type);
        throw new Error('Method not implemented.');
    }
    public save(): IDamageData {
        throw new Error('Method not implemented.');
    }
}

export async function CreateDamage(data: IDamageData, ctx: Registry): Promise<Damage> {
    let mb = new MixBuilder<Damage, IDamageData>({
        Icon,
        Text,
        DiscordEmoji,
        Color,
        Max,
    });
    // Add our props
    mb.with(new RWMix("DType", "type", restrict_enum(DamageType, DamageType.Variable), ident));
    mb.with(new RWMix("Value", "val", async x => "" + x, ident)); // Coerce to strings on way in
    mb.with(new RWMix("Override", "override", defb(false), ident)); // We assume not overridden

    return mb.finalize(data, ctx);
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


function DiscordEmoji(this: Damage): string {
    return `:cc_damage_${this.DType.toLowerCase()}:`;
}

// function Color(this: Damage): string {
    // return `damage--${this.DType.toLowerCase()}`;
// }


export const DamagesMixReader = def_empty_map(CreateDamage);
