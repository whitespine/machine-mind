import { PilotEquipment, Range, Damage, ItemType, DamageType, Tag } from "@/class";
import { IPilotEquipmentData, IRangeData, IDamageData } from "@/interface";
import { IEquippable, ITagged } from '../CompendiumItem';

export interface IPilotWeaponData extends IEquippable, ITagged  {
  id: string,
  name: string, // v-html
  type: "Weapon",
  description: string,
  range: IRangeData[],
  damage: IDamageData[],
}

export class PilotWeapon {
    private id: string;
    private name: string
    private description: string;
    private range: Range[];
    private damage: Damage[];
    private tags: Tag[];

    public constructor(data: IPilotWeaponData) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.range = data.range.map(x => new Range(x));
        this.damage = data.damage.map(x => new Damage(x));
        this.tags = Tag.Deserialize(data.tags || []);
    }

    public Serialize(): IPilotWeaponData {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            range: this.range.map(r => r.Serialize()),
            damage: this.damage.map(d => d.Serialize()),
            type: "Weapon",




        };
    }

    public get Range(): Range[] {
        return this.range;
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

    public get CanSetDamage(): boolean {
        return this._tags.some(x => x.id === "tg_set_damage_type");
    }


}
