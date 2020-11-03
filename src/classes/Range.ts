import { RangeType } from "./enums";
import { SimSer } from "@/registry";
import { MechWeapon } from "./mech/MechWeapon";
import { Bonus } from "@/class";

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

export interface IRangeData {
    type: RangeType;
    val: number;
    override?: boolean;
    bonus?: number;
}

export class Range extends SimSer<IRangeData> {
    RangeType!: RangeType;
    Value!: number;
    Override!: boolean;
    Bonus!: number;

    protected load(data: IRangeData): void {
        this.RangeType = data.type;
        this.Value = data.val;
        this.Override = data.override || false;
        this.Bonus = data.bonus || 0;
    }

    public save(): IRangeData {
        return {
            type: this.RangeType,
            val: this.Value,
            override: this.Override || undefined,
            bonus: this.Bonus || undefined,
        };
    }

    public get Icon(): string {
        return `cci-${this.RangeType.toLowerCase()}`;
    }

    public get DiscordEmoji(): string {
        switch (this.RangeType) {
            case RangeType.Range:
            case RangeType.Threat:
            case RangeType.Thrown:
                return `:cc_${this.RangeType.toLowerCase()}:`;
        }
        return `:cc_aoe_${this.RangeType.toLowerCase()}:`;
    }

    public get Text(): string {
        if (this.Override) return this.Value.toString();
        if (this.Bonus) return `${this.RangeType} ${this.Value} (+${this.Bonus})`;
        return `${this.RangeType} ${this.Value}`;
    }

    // Checks if the given bonus can affect this range
    public can_bonus_apply(b: Bonus) {
        return b.RangeTypes.includes(this.RangeType);
    }

    public static CalculateRange(item: MechWeapon, mech: Mech): Range[] {
        const bonuses = mech.Bonuses.filter(x => x.ID === "range");
        const output = [];
        item.Range.forEach(r => {
            if (r.Override) return;
            let bonus = 0;
            bonuses.forEach(b => {
                if (b.WeaponTypes.length && !b.WeaponTypes.some(wt => item.WeaponType === wt))
                    return;
                if (b.WeaponSizes.length && !b.WeaponSizes.some(ws => item.Size === ws)) return;
                if (
                    b.DamageTypes.length &&
                    !b.DamageTypes.some(dt => item.DamageType.some(x => x === dt))
                )
                    return;
                if (!b.RangeTypes.length || b.RangeTypes.some(rt => r.Type === rt)) {
                    bonus += Bonus.Evaluate(b, mech.Pilot);
                }
            });
            output.push(
                new Range({
                    type: r.Type,
                    val: r._value,
                    override: r.Override,
                    bonus: bonus,
                })
            );
        });
        return output;
    }
}
