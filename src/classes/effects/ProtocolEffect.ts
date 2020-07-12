import { IEffectData } from "@/interface";
import { ActivationType, EffectType } from "@/class";
import { ItemEffect } from "./ItemEffect";

interface IProtocolEffectData extends IEffectData {
    detail: string;
}

class ProtocolEffect extends ItemEffect {
    public readonly Detail: string;
    public readonly Name: string | null;

    public constructor(data: IProtocolEffectData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.activation = ActivationType.Protocol;
        this.effectType = EffectType.Protocol;
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

export { IProtocolEffectData, ProtocolEffect };
