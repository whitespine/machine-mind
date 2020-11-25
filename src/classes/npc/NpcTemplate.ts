import { NpcFeature } from "@src/class";
import { defaults } from '@src/funcs';
import { EntryType, OpCtx, quick_mm_ref, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";

interface AllNpcTemplateData {
    name: string;
    description: string;
    power: number;
}

export interface PackedNpcTemplateData extends AllNpcTemplateData {
    base_features: string[];
    optional_features: string[];
}

export interface RegNpcTemplateData extends AllNpcTemplateData {
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
}

export class NpcTemplate extends RegEntry<EntryType.NPC_TEMPLATE> {
    Name!: string;
    Description!: string;
    BaseFeatures!: NpcFeature[];
    OptionalFeatures!: NpcFeature[];
    Power!: number;

    protected async load(data: RegNpcTemplateData): Promise<void> {
        data = {...defaults.NPC_TEMPLATE(), ...data};
        this.Name = data.name;
        this.Description = data.description;
        this.Power = data.power;
        this.BaseFeatures = await this.Registry.resolve_many(this.OpCtx, data.base_features);
        this.OptionalFeatures = await this.Registry.resolve_many(
            this.OpCtx,
            data.optional_features
        );
    }

    public save(): RegNpcTemplateData {
        return {
            base_features: SerUtil.ref_all(this.BaseFeatures),
            optional_features: SerUtil.ref_all(this.OptionalFeatures),
            description: this.Description,
            name: this.Name,
            power: this.Power,
        };
    }

    public static async unpack(
        data: PackedNpcTemplateData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<NpcTemplate> {
        let rdata: RegNpcTemplateData = {
            ...defaults.NPC_TEMPLATE(),
            name: data.name,
            description: data.description,
            power: data.power,

            base_features: data.base_features.map(f => quick_mm_ref(EntryType.NPC_FEATURE, f)),
            optional_features: data.optional_features.map(f => quick_mm_ref(EntryType.NPC_FEATURE, f))
        };
        return reg.get_cat(EntryType.NPC_TEMPLATE).create_live(ctx, rdata);
    }
}
