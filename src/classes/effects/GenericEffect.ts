import { ActivationType, EffectType, ItemEffect } from "@/class";

export class GenericEffect extends ItemEffect {
    public readonly Detail: string;

    public constructor(effect: string, err?: boolean | null) {
        super(err);
        this.Detail = effect;
        this.activation = ActivationType.None;
        this.effectType = EffectType.Generic;
        this.tags = [];
    }
}
