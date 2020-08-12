import { IEffectData } from "@/interface";
import { ActivationType, EffectType, ItemEffect } from "@/class";

interface IInvadeOptionData {
    name: string;
    detail: string;
    activation?: ActivationType | null;
}

interface ITechEffectData extends IEffectData {
    detail: string;
    options?: IInvadeOptionData[] | null;
    option_set?: string | null;
}

class InvadeOption {
    public readonly Name: string;
    public readonly Detail: string;
    public readonly Activation: ActivationType;

    public constructor(data: IInvadeOptionData, activation: ActivationType | null | undefined) {
        this.Name = data.name;
        this.Detail = data.detail;
        this.Activation = activation || ActivationType.Quick;
    }

    public toString(): string {
        return [(this.Name || "").toUpperCase(), this.Detail].filter(el => el !== "").join("\n");
    }
}

class TechEffect extends ItemEffect {
    public readonly Name: string | null;
    public readonly Detail: string;
    public readonly OptionSet: string;
    public readonly Options: InvadeOption[] | null;

    public constructor(data: ITechEffectData, err?: boolean | null) {
        super(err);
        this.Name = data.name || null;
        this.Detail = data.detail;
        this.OptionSet = data.option_set || "";
        this.Options = data.options
            ? data.options.map(x => new InvadeOption(x, data.activation))
            : [];
        this.activation = data.activation || ActivationType.Quick;
        this.effectType = EffectType.Tech;
        this.tags = data.tags || [];
    }

    public toString(): string {
        return [
            this.activation + " " + this.effectType + " // " + this.OptionSet,
            (this.Name || "").toUpperCase(),
            this.Tags.length ? "Tags: " + this.Tags : "",
            this.Detail,
            this.Options?.map(a => a.toString()).join("\n"),
        ]
            .filter(el => el)
            .join("\n");
    }
}

export { IInvadeOptionData, ITechEffectData, TechEffect };
