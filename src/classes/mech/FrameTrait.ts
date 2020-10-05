import { Action, Bonus, Counter, Synergy } from '@/class';
import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData} from '@/interface';
import { ActionsMixReader, CountersMixReader, ident, ident_drop_null, MixBuilder, RWMix, MixLinks, ser_many, IntegratedMixReader, defs, def, SynergyMixReader, BonusesMixReader, IntegratedMixWriter } from '@/mixmeta';
import { Deployable, DeployableMixReader  } from '../Deployable';
import { FrameEffectUse } from '../enums';
import { Registry, VRegistryItem } from '../registry';

// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

export interface IFrameTraitData {
  "name": string,
  "description": string, // v-html
  "use"?: FrameEffectUse
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[]
  "deployables"?: IDeployableData[],
  "counters"?: ICounterData[],
  "integrated"?: string[] 
}

export interface FrameTrait extends MixLinks<IFrameTraitData> {
    Name: string;
    Description: string;
    Use: FrameEffectUse | null;
    Actions: Action[];
    Bonuses: Bonus[]
    Synergies: Synergy[];
    Deployables: Deployable[];
    Counters: Counter[];
    Integrated: VRegistryItem[];
}

export async function CreateFrameTrait(data: IFrameTraitData | null, ctx: Registry): Promise<FrameTrait> {
    let mb = new MixBuilder<FrameTrait, IFrameTraitData>({});
    mb.with(new RWMix("Name", "name", defs("New Frame Trait"), ident));
    mb.with(new RWMix("Description", "description", defs("Trait description"), ident));
    mb.with(new RWMix("Use", "use", def<FrameEffectUse | null>(null), ident_drop_null));

    mb.with(new RWMix("Actions", "actions", ActionsMixReader, ser_many));
    mb.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, ser_many));
    mb.with(new RWMix("Synergies", "synergies", SynergyMixReader, ser_many));
    mb.with(new RWMix("Deployables", "deployables", DeployableMixReader, ser_many));
    mb.with(new RWMix("Counters", "counters", CountersMixReader, ser_many));
    mb.with(new RWMix("Integrated", "integrated", IntegratedMixReader, IntegratedMixWriter ));

    return mb.finalize(data, ctx);
}

