import { PilotEquipment, Range, Damage, ItemType, DamageType } from "@/class";
import { IPilotEquipmentData, IRangeData, IDamageData } from "@/interface";

export interface IPilotWeaponData extends IPilotEquipmentData {
    range: IRangeData[];
    damage: IDamageData[];
    effect?: string | null;
}

export class PilotWeapon extends PilotEquipment {
    private range: Range[];
    private damage: Damage[];
    private effect: string;

    public constructor(data: IPilotWeaponData) {
        super(data);
        this.range = data.range.map(x => new Range(x));
        this.damage = data.damage.map(x => new Damage(x));
        this.effect = data.effect || "";
        this._item_type = ItemType.PilotWeapon;
    }

    public get Range(): Range[] {
        return this.range;
    }

    public get DamageTypeOverride(): string | null {
        return this._custom_damage_type || null;
    }

    public set DamageTypeOverride(val: string | null) {
        this._custom_damage_type = val;
        this.save();
    }

    public get DefaultDamageType(): DamageType {
        if (0 === this.Damage.length) {
            return DamageType.Variable;
        } else {
            return this.Damage[0].Type;
        }
    }

    public get Damage(): Damage[] {
        return this.damage;
    }

    public get MaxDamage(): number {
        if (0 === this.Damage.length) {
            return 0;
        } else {
            return this.Damage[0].Max;
        }
    }

    public get Effect(): string {
        return this.effect;
    }
}
