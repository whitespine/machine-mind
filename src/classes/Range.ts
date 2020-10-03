import { RangeType } from "@/class";
import { ident, MixBuilder, RWMix, MixLinks, def, defb, defn, defs, ser_many, def_empty_map } from "@/mixmeta";
import { Registry } from '@/classes/registry';

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface IRangeData {
    type: RangeType;
    val: number;
    override?: boolean;
    // bonus?: number | null;
}

export interface Range extends MixLinks<IRangeData> {
    Type: RangeType;
    Value: number;
    Override: boolean;
    // Bonus: number | null

    // Methods
    Icon(): string;
    DiscordEmoji(): string;
    Text(): string;
}

export function CreateRange(data: IRangeData | null, ctx: Registry): Range {
    let mb = new MixBuilder<Range, IRangeData>({});
    mb.with(new RWMix("Type", "type", getRangeType, ident));
    mb.with(new RWMix("Value", "val", defn(5), ident));
    mb.with(new RWMix("Override", "override", defb(false), ident));
    // mb.with(new Mixlet("Bonus", "bonus", null, ident, ident));

    let rv = mb.finalize(data, ctx);
    return rv;
}

// Error correction
function getRangeType(str?: string): RangeType {
    switch (str?.toLowerCase()) {
        case "blast":
            return RangeType.Blast;
        case "burst":
            return RangeType.Burst;
        case "cone":
            return RangeType.Cone;
        case "line":
            return RangeType.Line;
        case "threat":
            return RangeType.Threat;
        case "thrown":
            return RangeType.Thrown;
        default:
        case "range":
            return RangeType.Range;
    }
}

//   public get Value(): string {
//     if (this._bonus) return (this._value + this._bonus).toString();
//      return this._value.toString();
//   }

//  public get Max(): number {
//    return this._value + this._bonus;
//  }

function Icon(this: Range): string {
    return `cci-${this.Type.toLowerCase()}`;
}

function DiscordEmoji(this: Range): string {
    switch (this.Type) {
        case RangeType.Range:
        case RangeType.Threat:
        case RangeType.Thrown:
            return `:cc_${this.Type.toLowerCase()}:`;
    }
    return `:cc_aoe_${this.Type.toLowerCase()}:`;
}

function Text(this: Range): string {
    if (this.Override) return this.Value.toString();
    // if (this.Bonus) return `${this.Type} ${this.Value} (+${this.Bonus})`;
    return `${this.Type} ${this.Value}`;
}

// Compute range bonuses.
// Not yet functional....
/*
function    AddBonuses(this: Range,
        ranges: Range[],
        bonuses: { type: RangeType; val: number }[]
    ): Range[] {
        let output = [] as Range[];
        ranges.forEach(range => {
            let bonus = bonuses
                .filter(x => x.type === range.Type)
                .map(x => x.val)
                .reduce((sum, bonus) => sum + bonus, 0);
            output.push(
                new Range({
                    type: range.Type,
                    val: range._value,
                    override: range._override,
                    bonus: bonus,
                })
            );
        });
        return output;
    }
}
*/
// export const RangesMixReader = (x: IRangeData[] | undefined) => (x || []).map(CreateRange);
// export const RangesMixWriter = (x: Range[]) => x.map(i => i.Serialize());
export const RangesMixReader = def_empty_map(CreateRange);
export const RangesMixWriter = ser_many;
