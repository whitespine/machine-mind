import { ident, MixBuilder, RWMix, MixLinks, def, defb, defn, defs, ser_many, def_empty_map, restrict_enum } from "@/mixmeta.typs";
import { Registry } from '@/classes/registry';
import { RangeType } from './enums';
import { SimSer } from '@/new_meta';

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface IRangeData {
    type: RangeType;
    val: number;
    override?: boolean;
    bonus?: number;
}

export class Range extends SimSer<IRangeData> {
    Type!: RangeType;
    Value!: number;
    Override!: boolean;
    Bonus!: number;

    protected load(data: IRangeData): void {
        this.Type = data.type;
        this.Value = data.val;
        this.Override = data.override || false;
        this.Bonus = data.bonus || 0;
    }

    public save(): IRangeData {
        return {
            type: this.Type,
            val: this.Value,
            override: this.Override || undefined,
            bonus: this.Bonus || undefined
        }
    }
      public get Icon(): string {
    return `cci-${this._range_type.toLowerCase()}`
  }

  public get DiscordEmoji(): string {
    switch (this._range_type) {
      case RangeType.Range:
      case RangeType.Threat:
      case RangeType.Thrown:
        return `:cc_${this._range_type.toLowerCase()}:`
    }
    return `:cc_aoe_${this._range_type.toLowerCase()}:`
  }

  public get Text(): string {
    if (this._override) return this.Value.toString()
    if (this._bonus) return `${this._range_type} ${this.Value} (+${this._bonus})`
    return `${this._range_type} ${this.Value}`
  }

  public static CalculateRange(item: MechWeapon, mech: Mech): Range[] {
    if (!item || !mech) return []
    if (!Bonus.get('range', mech)) return item.Range
    const bonuses = mech.Bonuses.filter(x => x.ID === 'range')
    const output = []
    item.Range.forEach(r => {
      if (r.Override) return
      let bonus = 0
      bonuses.forEach(b => {
        if (b.WeaponTypes.length && !b.WeaponTypes.some(wt => item.WeaponType === wt)) return
        if (b.WeaponSizes.length && !b.WeaponSizes.some(ws => item.Size === ws)) return
        if (b.DamageTypes.length && !b.DamageTypes.some(dt => item.DamageType.some(x => x === dt)))
          return
        if (!b.RangeTypes.length || b.RangeTypes.some(rt => r.Type === rt)) {
          bonus += Bonus.Evaluate(b, mech.Pilot)
        }
      })
      output.push(
        new Range({
          type: r.Type,
          val: r._value,
          override: r._override,
          bonus: bonus,
        })
      )
    })
    return output
  }
}