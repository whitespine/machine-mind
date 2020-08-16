import {
    Tag,
    GenericEffect,
    ChargeEffect,
    ProtocolEffect,
    ReactionEffect,
    TechEffect,
    DroneEffect,
    BonusEffect,
    BasicEffect,
    DeployableEffect,
    AIEffect,
    OffensiveEffect,
    ProfileEffect,
} from "@/class";
import { ITagData } from "@/interface";

export enum EffectType {
    Generic = "Generic", // Covers old/fallback/simple
    Basic = "Basic",
    Charge = "Charge",
    Deployable = "Deployable",
    AI = "AI",
    Protocol = "Protocol",
    Reaction = "Reaction",
    Tech = "Tech",
    Drone = "Drone",
    Bonus = "Bonus",
    Offensive = "Offensive",
    Profile = "Profile",
}

export enum ActivationType {
    None = "None",
    Passive = "Passive",
    Quick = "Quick",
    Full = "Full",
    Other = "Other",
    Reaction = "Reaction",
    Protocol = "Protocol",
}

export interface IEffectData {
    effect_type: EffectType;
    name?: string | null;
    activation?: ActivationType | null;
    tags?: ITagData[] | null;
}

export abstract class ItemEffect {
    private _err: boolean;
    // TODO: make this better
    protected effectType!: EffectType | null;
    protected activation!: ActivationType | null;
    protected tags!: ITagData[] | null;

    public constructor(err?: boolean | null) {
        this._err = err || false;
    }

    public get EffectType(): EffectType | null {
        return this.effectType;
    }

    public get Activation(): ActivationType | null {
        return this.activation || ActivationType.None;
    }

    public get Tags(): Tag[] {
        return this.tags ? Tag.Deserialize(this.tags) : [];
    }

    public static Generate(data: any): ItemEffect | null {
        if (!data || data === "") return null;
        if (typeof data === "string") return new GenericEffect(data);
        if (!data.effect_type) return new GenericEffect("ERR: Effect Type Missing", true);
        if (data.effect_type === EffectType.Basic) return new BasicEffect(data);
        if (data.effect_type === EffectType.Charge) return new ChargeEffect(data);
        if (data.effect_type === EffectType.Deployable) return new DeployableEffect(data);
        if (data.effect_type === EffectType.AI) return new AIEffect(data);
        if (data.effect_type === EffectType.Protocol) return new ProtocolEffect(data);
        if (data.effect_type === EffectType.Reaction) return new ReactionEffect(data);
        if (data.effect_type === EffectType.Tech) return new TechEffect(data);
        if (data.effect_type === EffectType.Drone) return new DroneEffect(data);
        if (data.effect_type === EffectType.Bonus) return new BonusEffect(data);
        if (data.effect_type === EffectType.Offensive) return new OffensiveEffect(data);
        if (data.effect_type === EffectType.Profile) return new ProfileEffect(data);
        return new GenericEffect("ERR: Unknown Effect Type", true);
    }
}
