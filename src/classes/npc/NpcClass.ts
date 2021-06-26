import { NpcFeature } from "@src/class";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { defaults } from "@src/funcs";
import { INpcClassStats } from "@src/interface";
import { merge_defaults } from "../default_entries";

interface AllNpcClassData {
    name: string;
    role: string;
    info: { flavor: string; tactics: string };
    power: number;
}
export interface PackedNpcClassData extends AllNpcClassData {
    id: string;
    base_features: string[];
    optional_features: string[];
    stats: INpcClassStats;
}

export interface RegNpcClassData extends AllNpcClassData {
    lid: string;
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
    base_stats: INpcClassStats;
}

export class NpcClass extends RegEntry<EntryType.NPC_CLASS> {
    LID!: string;
    Name!: string;
    Role!: string;
    Info!: {
        flavor: string;
        tactics: string;
    };
    Stats!: INpcClassStats;
    BaseFeatures!: NpcFeature[];
    OptionalFeatures!: NpcFeature[];
    Power!: number;

    public async load(data: RegNpcClassData): Promise<void> {
        merge_defaults(data, defaults.NPC_CLASS());
        this.LID = data.lid;
        this.Name = data.name;
        this.Role = data.role;
        this.Info = data.info;
        this.Stats = data.base_stats; // new NpcClassStats(data.base_stats);
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

    protected save_imp(): RegNpcClassData {
        return {
            base_features: SerUtil.ref_all(this.BaseFeatures),
            optional_features: SerUtil.ref_all(this.OptionalFeatures),
            lid: this.LID,
            info: this.Info,
            name: this.Name,
            power: this.Power,
            role: this.Role,
            base_stats: this.Stats,
        };
    }

    public static async unpack(
        data: PackedNpcClassData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<NpcClass> {
        let rdata: RegNpcClassData = merge_defaults(
            {
                // ...data,
                info: data.info,
                lid: data.id,
                name: data.name,
                power: data.power,
                role: data.role,
                base_stats: { ...data.stats },

                base_features: data.base_features.map(f =>
                    quick_local_ref(reg, EntryType.NPC_FEATURE, f)
                ),
                optional_features: data.optional_features.map(f =>
                    quick_local_ref(reg, EntryType.NPC_FEATURE, f)
                ),
            },
            defaults.NPC_CLASS()
        );
        return reg.get_cat(EntryType.NPC_CLASS).create_live(ctx, rdata);
    }

    public get RoleIcon(): string {
        if (this.Role.toLowerCase() === "biological") return "mdi-heart-pulse";
        return `cci-role-${this.Role}`;
    }

    public get Color(): string {
        return `role--${this.Role}`;
    }

    public async emit(): Promise<PackedNpcClassData> {
        return {
            base_features: this.BaseFeatures.map(x => x.LID),
            optional_features: this.OptionalFeatures.map(x => x.LID),
            id: this.LID,
            info: this.Info,
            name: this.Name,
            power: this.Power,
            role: this.Role,
            stats: this.Stats,
        };
    }
}
