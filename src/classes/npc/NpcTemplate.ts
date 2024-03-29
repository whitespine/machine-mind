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
import { merge_defaults } from "../default_entries";

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
        merge_defaults(data, defaults.NPC_TEMPLATE());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Power = data.power;
        this.BaseFeatures = await this.Registry.resolve_many(this.OpCtx, data.base_features, {
            wait_ctx_ready: false,
        });
        this.OptionalFeatures = await this.Registry.resolve_many(
            this.OpCtx,
            data.optional_features,
            { wait_ctx_ready: false }
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
        let rdata: RegNpcTemplateData = merge_defaults(
            {
                description: data.description,
                lid: data.id,
                name: data.name,
                power: data.power,
                base_features: data.base_features.map(f =>
                    quick_local_ref(reg, EntryType.NPC_FEATURE, f)
                ),
                optional_features: data.optional_features.map(f =>
                    quick_local_ref(reg, EntryType.NPC_FEATURE, f)
                ),
            },
            defaults.NPC_TEMPLATE()
        );
        return reg.get_cat(EntryType.NPC_TEMPLATE).create_live(ctx, rdata);
    }

    public async emit(): Promise<PackedNpcTemplateData> {
        return {
            base_features: this.BaseFeatures.map(x => x.LID),
            optional_features: this.OptionalFeatures.map(x => x.LID),
            id: this.LID,
            description: this.Description,
            name: this.Name,
            power: this.Power,
        };
    }
}
