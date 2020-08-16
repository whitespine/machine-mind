import { IEffectData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";
export interface IBonusEffectData extends IEffectData {
    detail: string;
    size?: number | null;
    hp?: number | null;
    armor?: number | null;
    evasion?: number | null;
    edef?: number | null;
}

export class BonusEffect extends ItemEffect {
    public readonly Name: string | null;
    public readonly Detail: string;
    public readonly Size: number | null;
    public readonly HP: number | null;
    public readonly Armor: number | null;
    public readonly Evasion: number | null;
    public readonly EDef: number | null;

    public constructor(data: IBonusEffectData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.Size = data.size || 0;
        this.HP = data.hp || 0;
        this.Armor = data.armor || 0;
        this.Evasion = data.evasion || 0;
        this.EDef = data.edef || 0;
        this.activation = ActivationType.None;
        this.effectType = EffectType.Bonus;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            "Activation: " + this.activation + "   Type: " + this.effectType,
            (this.Name || "").toUpperCase(),
            [
                "//",
                this.Size ? "Size: " + this.Size : "",
                this.HP ? "HP: " + this.HP : "",
                this.Armor ? "Armor: " + this.Armor : "",
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
