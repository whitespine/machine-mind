import { IRangeData, IDamageData } from "@/interface";
import { IEffectData } from "@/interface";
import { ActivationType, EffectType, Damage, Range, ItemEffect } from "@/class";

export interface IProfileEffectData extends IEffectData {
    name: string;
    range?: IRangeData[] | null;
    damage?: IDamageData[] | null;
    detail?: string | null;
}

export class ProfileEffect extends ItemEffect {
    public readonly Name: string;
    public readonly Detail: string | null;
    public readonly Range: Range[];
    public readonly Damage: Damage[];

    public constructor(data: IProfileEffectData) {
        super();
        this.Name = data.name;
        this.Damage = data.damage ? data.damage.map(x => new Damage(x)) : [];
        this.Range = data.range ? data.range.map(x => new Range(x)) : [];
        this.tags = data.tags ? data.tags : [];
        this.Detail = data.detail || null;
        this.activation = ActivationType.None;
        this.effectType = EffectType.Profile;
        this.tags = data.tags || [];
    }
}
