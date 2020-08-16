import { IEffectData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";

export interface IBasicEffectData extends IEffectData {
    detail: string;
}

export class BasicEffect extends ItemEffect {
    public readonly Detail: string;
    public readonly Name: string | null;

    public constructor(data: IBasicEffectData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.activation = data.activation || ActivationType.None;
        this.effectType = EffectType.Basic;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            "Activation: " + this.activation,
            (this.Name || "").toUpperCase(),
            this.Tags.length ? "Tags: " + this.Tags : "",
            this.Detail,
        ]
            .filter(el => el !== "")
            .join("\n");
    }
}
