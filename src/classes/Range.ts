import { RangeType } from "../enums";
import { SimSer } from "@src/registry";
import { MechWeapon } from "./mech/MechWeapon";
import { Bonus, Mech } from "@src/class";

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

    public load(data: IRangeData): void {
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
        const bonuses = mech.AllBonuses.filter(x => x.ID === "range");
        const output: Range[] = [];
        item.SelectedProfile.BaseRange.forEach(r => {
            if (r.Override) return;
            let bonus = 0;
            bonuses.forEach(b => {
                if (
                    b.WeaponTypes.length &&
                    !b.WeaponTypes.some(wt => item.SelectedProfile.WepType === wt)
                )
                    return;
                if (b.WeaponSizes.length && !b.WeaponSizes.some(ws => item.Size === ws)) return;
                if (
                    b.DamageTypes.length &&
                    !b.DamageTypes.some(dt =>
                        item.SelectedProfile.BaseDamage.some(x => x.DamageType === dt)
                    )
                )
                    return;
                if (!b.RangeTypes.length || b.RangeTypes.some(rt => r.RangeType === rt)) {
                    bonus += b.evaluate(mech.Pilot);
                }
            });
            output.push(
                new Range({
                    type: r.RangeType,
                    val: r.Value,
                    override: r.Override,
                    bonus: bonus,
                })
            );
        });
        return output;
    }
}
