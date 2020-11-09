import { Action, Bonus, Counter, Deployable, Synergy } from "@/class";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    RegCounterData,
} from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@/registry";
import { FrameEffectUse } from "../enums";

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

export class FrameTrait extends RegEntry<EntryType.FRAME_TRAIT, RegFrameTraitData> {
    Name!: string;
    Description!: string;
    Use!: FrameEffectUse;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];

    public async load(data: RegFrameTraitData): Promise<void> {
        this.Name = data.name;
        this.Description = data.description;
        this.Use = data.use ?? null;
        await SerUtil.load_commons(this.Registry, data, this);
    }

    public async save(): Promise<RegFrameTraitData> {
        return {
            name: this.Name,
            description: this.Description,
            use: this.Use,
            ...(await SerUtil.save_commons(this)),
            integrated: SerUtil.ref_all(this.Integrated),
            counters: SerUtil.sync_save_all(this.Counters),
        };
    }

    public static async unpack(data: PackedFrameTraitData, reg: Registry): Promise<FrameTrait> {
        let rdata: RegFrameTraitData = {
            name: data.name,
            description: data.description,
            use: data.use ?? FrameEffectUse.Unknown,
            ...(await SerUtil.unpack_commons_and_tags(data, reg)),
            counters: SerUtil.unpack_counters_default(data.counters),
            integrated: SerUtil.unpack_integrated_refs(data.integrated),
        };
        return reg.get_cat(EntryType.FRAME_TRAIT).create(rdata);
    }
    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
