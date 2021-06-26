import { Action, Bonus, Counter, Deployable, Synergy } from "@src/class";
import { defaults } from "@src/funcs";
import {
    RegActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    RegCounterData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@src/registry";
import { FrameEffectUse } from "@src/enums";
import { PackedActionData } from "../Action";
import { merge_defaults } from "../default_entries";

// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

interface AllFrameTraitData {
    name: string;
    description: string; // v-html
    use?: FrameEffectUse;
    synergies?: ISynergyData[];
}

export interface PackedFrameTraitData extends AllFrameTraitData {
    integrated?: string[];
    counters?: PackedCounterData[];
    deployables?: PackedDeployableData[];
    bonuses?: PackedBonusData[];
    actions?: PackedActionData[];
}

export interface RegFrameTraitData extends Required<AllFrameTraitData> {
    bonuses: RegBonusData[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    actions: RegActionData[];
}

export class FrameTrait extends RegSer<RegFrameTraitData> {
    Name!: string;
    Description!: string;
    Use!: FrameEffectUse;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any>[];

    public async load(data: RegFrameTraitData): Promise<void> {
        merge_defaults(data, defaults.FRAME_TRAIT());
        this.Name = data.name;
        this.Description = data.description;
        this.Use = data.use ?? null;
        await SerUtil.load_basd(this.Registry, data, this, this.Name);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {
            wait_ctx_ready: false,
        });
        this.Counters = SerUtil.process_counters(data.counters);
    }

    protected save_imp(): RegFrameTraitData {
        return {
            name: this.Name,
            description: this.Description,
            use: this.Use,
            ...SerUtil.save_commons(this),
            integrated: SerUtil.ref_all(this.Integrated),
            counters: SerUtil.save_all(this.Counters),
        };
    }

    public static async unpack(
        data: PackedFrameTraitData,
        reg: Registry,
        ctx: OpCtx,
        frame_id: string
    ): Promise<RegFrameTraitData> {
        let rdata: RegFrameTraitData = merge_defaults(
            {
                name: data.name,
                use: data.use,
                description: data.description,
                ...(await SerUtil.unpack_basdt({ id: frame_id, ...data }, reg, ctx)),
                counters: SerUtil.unpack_counters_default(data.counters),
                integrated: SerUtil.unpack_integrated_refs(reg, data.integrated),
            },
            defaults.FRAME_TRAIT()
        );
        return rdata;
    }
    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public async emit(): Promise<PackedFrameTraitData> {
        return {
            name: this.Name,
            description: this.Description,

            use: this.Use,

            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            counters: await SerUtil.emit_all(this.Counters),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            integrated: this.Integrated.map(i => (i as any).LID ?? ""),
        };
    }
}
