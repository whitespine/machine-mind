import { Action, Bonus, Counter, Deployable, Synergy } from "@src/class";
import { defaults } from "@src/funcs";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    RegCounterData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { FrameEffectUse } from "../../enums";

// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

interface AllFrameTraitData {
    name: string;
    description: string; // v-html
    use?: FrameEffectUse;
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
}

export interface PackedFrameTraitData extends AllFrameTraitData {
    integrated?: string[];
    counters?: PackedCounterData[];
    deployables?: PackedDeployableData[];
}

export interface RegFrameTraitData extends Required<AllFrameTraitData> {
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
}

export class FrameTrait extends RegEntry<EntryType.FRAME_TRAIT> {
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
        await SerUtil.load_basd(this.Registry, data, this);
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
        ctx: OpCtx
    ): Promise<FrameTrait> {
        let rdata: RegFrameTraitData = {
            ...defaults.FRAME_TRAIT(),
            ...data,
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
            counters: SerUtil.unpack_counters_default(data.counters),
            integrated: SerUtil.unpack_integrated_refs(reg, data.integrated),
        };
        return reg.get_cat(EntryType.FRAME_TRAIT).create_live(ctx, rdata, true);
    }
    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
