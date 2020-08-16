import { ActivationType, EffectType, ItemEffect } from "@/class";
import { IEffectData } from "@/interface";

export interface IAIData extends IEffectData {
    size: number;
    hp: number;
    edef: number;
    evasion: number;
    detail: string;
    abilities: IEffectData[];
}

export class AIEffect extends ItemEffect {
    public readonly Detail: string;
    public readonly Abilities: ItemEffect[];
    public readonly Name: string | null;

    public constructor(data: IAIData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.Abilities = data.abilities
            .map(x => ItemEffect.Generate(x))
            .filter(x => x) as ItemEffect[];
        this.activation = ActivationType.None;
        this.effectType = EffectType.AI;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            "Type: " + this.effectType,
            (this.Name || "").toUpperCase(),
            this.Tags.length ? "Tags: " + this.Tags : "",
            this.Detail,
            this.Abilities.map(a => a.toString()).join("\n"),
        ]
            .filter(el => el !== "")
            .join("\n");
    }
}
