import { IEffectData } from "@/interface";
import { ActivationType, EffectType } from "@/class";
import { ItemEffect } from "./ItemEffect";
interface IDeployableData extends IEffectData {
    count?: number | null;
    size?: number | null;
    hp?: number | null;
    evasion?: number | null;
    edef?: number | null;
    detail: string;
}

class DeployableEffect extends ItemEffect {
    public readonly Name: string | null;
    public readonly Detail: string | null;
    public readonly Count: number | null;
    public readonly Size: number | null;
    public readonly HP: number | null;
    public readonly Evasion: number | null;
    public readonly EDef: number | null;

    public constructor(data: IDeployableData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.Count = data.count || null;
        this.Size = data.size || null;
        this.HP = data.hp || null;
        this.Evasion = data.evasion || null;
        this.EDef = data.edef || null;
        this.activation = data.activation || ActivationType.Quick;
        this.effectType = EffectType.Deployable;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            "Activation: " + this.activation + "   Type: " + this.effectType,
            (this.Name || "").toUpperCase(),
            [
                "//",
                this.Count ? "Uses: " + this.Count : "",
                this.Size ? "Size: " + this.Size : "",
                this.HP ? "HP: " + this.HP : "",
                this.Evasion ? "Evasion: " + this.Evasion : "",
                this.EDef ? "E-defense: " + this.EDef : "",
            ]
                .filter(el => el !== "")
                .join("   "),
            this.Tags.length ? "Tags: " + this.Tags : "",
            this.Detail,
        ]
            .filter(el => el !== "")
            .join("\n");
    }
}

export { IDeployableData, DeployableEffect };
