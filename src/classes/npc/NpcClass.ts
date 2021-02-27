import { INpcClassStats, NpcClassStats } from "./NpcClassStats";
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

interface AllNpcClassData {
    id: string;
    name: string;
    role: string;
    info: { flavor: string; tactics: string };
    power: number;
}
export interface PackedNpcClassData extends AllNpcClassData {
    base_features: string[];
    optional_features: string[];
    stats: INpcClassStats;
}

export interface RegNpcClassData extends AllNpcClassData {
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
    base_stats: INpcClassStats;
}

export class NpcClass extends RegEntry<EntryType.NPC_CLASS> {
    ID!: string;
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
        data = { ...defaults.NPC_CLASS(), ...data };
        this.ID = data.id;
        this.Name = data.name;
        this.Role = data.role;
        this.Info = data.info;
        this.Stats = data.base_stats; // new NpcClassStats(data.base_stats);
        this.Power = data.power;
        this.BaseFeatures = await this.Registry.resolve_many(this.OpCtx, data.base_features);
        this.OptionalFeatures = await this.Registry.resolve_many(
            this.OpCtx,
            data.optional_features
        );
    }

    protected save_imp(): RegNpcClassData {
        return {
            base_features: SerUtil.ref_all(this.BaseFeatures),
            optional_features: SerUtil.ref_all(this.OptionalFeatures),
            id: this.ID,
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
        let rdata: RegNpcClassData = {
            ...defaults.NPC_CLASS(),
            ...data,
            base_stats: {...data.stats},

            base_features: data.base_features.map(f =>
                quick_local_ref(reg, EntryType.NPC_FEATURE, f)
            ),
            optional_features: data.optional_features.map(f =>
                quick_local_ref(reg, EntryType.NPC_FEATURE, f)
            ),
        };
        return reg.get_cat(EntryType.NPC_CLASS).create_live(ctx, rdata);
    }

    public get RoleIcon(): string {
        if (this.Role.toLowerCase() === "biological") return "mdi-heart-pulse";
        return `cci-role-${this.Role}`;
    }

    public get Color(): string {
        return `role--${this.Role}`;
    }
}
