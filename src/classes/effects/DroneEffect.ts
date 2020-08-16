import { IEffectData, ITagData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";

export interface IDroneData extends IEffectData {
    size: number;
    hp: number;
    armor?: number | null;
    edef: number;
    evasion: number;
    detail: string;
    abilities?: IEffectData[] | null;
    tags?: ITagData[] | null;
}

export class DroneEffect extends ItemEffect {
    public readonly Name: string | null;
    public readonly Detail: string;
    public readonly Size: number;
    public readonly HP: number;
    public readonly Armor: number;
    public readonly Evasion: number;
    public readonly EDef: number;
    public readonly Abilities: ItemEffect[];

    public constructor(data: IDroneData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.Size = data.size;
        this.HP = data.hp;
        this.Armor = data.armor || 0;
        this.Evasion = data.evasion;
        this.EDef = data.edef;
        this.Abilities = data.abilities
            ? (data.abilities.map(x => ItemEffect.Generate(x)).filter(x => x) as ItemEffect[])
            : [];
        this.activation = data.activation || ActivationType.Quick;
        this.effectType = EffectType.Drone;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            (this.Name || "").toUpperCase(),
            "Activation: " + this.activation + "   Type: " + this.effectType,
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
            this.Abilities?.map(a => a.toString()).join("\n"),
        ]
            .filter(el => el !== "")
            .join("\n");
    }
}
