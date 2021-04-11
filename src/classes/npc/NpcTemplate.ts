import { NpcFeature } from "@src/class";
import { defaults } from "@src/funcs";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";

interface AllNpcTemplateData {
    name: string;
    description: string;
    power: number;
}

export interface PackedNpcTemplateData extends AllNpcTemplateData {
    id: string;
    base_features: string[];
    optional_features: string[];
}

export interface RegNpcTemplateData extends AllNpcTemplateData {
    lid: string;
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
}

export class NpcTemplate extends RegEntry<EntryType.NPC_TEMPLATE> {
    LID!: string;
    Name!: string;
    Description!: string;
    BaseFeatures!: NpcFeature[];
    OptionalFeatures!: NpcFeature[];
    Power!: number;

    protected async load(data: RegNpcTemplateData): Promise<void> {
        data = { ...defaults.NPC_TEMPLATE(), ...data };
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Power = data.power;
        this.BaseFeatures = await this.Registry.resolve_many(this.OpCtx, data.base_features);
        this.OptionalFeatures = await this.Registry.resolve_many(
            this.OpCtx,
            data.optional_features
        );
    }

    protected save_imp(): RegNpcTemplateData {
        return {
            lid: this.LID,
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
            ...data,

            base_features: data.base_features.map(f =>
                quick_local_ref(reg, EntryType.NPC_FEATURE, f)
            ),
            optional_features: data.optional_features.map(f =>
                quick_local_ref(reg, EntryType.NPC_FEATURE, f)
            ),
        };
        return reg.get_cat(EntryType.NPC_TEMPLATE).create_live(ctx, rdata);
    }
}
