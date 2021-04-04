import { Action, Bonus, Counter, Deployable, Synergy } from "@src/class";
import { defaults } from "@src/funcs";
import {
    IActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    RegCounterData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@src/registry";
import { FrameEffectUse } from "@src/enums";

// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

interface AllFrameTraitData {
    name: string;
    description: string; // v-html
    use?: FrameEffectUse;
    actions?: IActionData[];
    synergies?: ISynergyData[];
}

export interface PackedFrameTraitData extends AllFrameTraitData {
    integrated?: string[];
    counters?: PackedCounterData[];
    deployables?: PackedDeployableData[];
    bonuses?: PackedBonusData[];
}

export interface RegFrameTraitData extends Required<AllFrameTraitData> {
    bonuses: RegBonusData[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
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
        data = { ...defaults.FRAME_TRAIT(), ...data };
        this.Name = data.name;
        this.Description = data.description;
        this.Use = data.use ?? null;
        await SerUtil.load_basd(this.Registry, data, this, this.Name);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated);
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
        let rdata: RegFrameTraitData = {
            ...defaults.FRAME_TRAIT(),
            ...data,
            ...(await SerUtil.unpack_basdt({id: frame_id, ...data}, reg, ctx)),
            counters: SerUtil.unpack_counters_default(data.counters),
            integrated: SerUtil.unpack_integrated_refs(reg, data.integrated),
        };
        return rdata;
    }
    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
