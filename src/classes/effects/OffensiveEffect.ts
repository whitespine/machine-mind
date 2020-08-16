import { IEffectData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";

export interface IOffensiveEffectData extends IEffectData {
    attack?: string | null;
    hit?: string | null;
    critical?: string | null;
    detail?: string | null;
    abilities?: IEffectData[] | null;
}

export class OffensiveEffect extends ItemEffect {
    public readonly Name: string | null;
    public readonly Detail: string | null;
    public readonly OnAttack: string | null;
    public readonly OnHit: string | null;
    public readonly OnCrit: string | null;
    public readonly Abilities?: ItemEffect[];

    public constructor(data: IOffensiveEffectData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail || null;
        this.OnAttack = data.attack || null;
        this.OnHit = data.hit || null;
        this.OnCrit = data.critical || null;
        this.Abilities = data.abilities
            ? (data.abilities.map(x => ItemEffect.Generate(x)).filter(a => a) as ItemEffect[])
            : [];
        this.activation = data.activation || ActivationType.None;
        this.effectType = EffectType.Offensive;
        this.tags = data.tags || [];
    }
}
