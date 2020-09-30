import { Action, Bonus, Counter } from '@/class';
import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData} from '@/interface';
import { ActionsMixReader, ActionsMixWriter, BonusMixReader, BonusMixWriter, CountersMixReader, CountersMixWriter, ident, ident_drop_null, MixBuilder, RWMix, MixLinks } from '@/mixmeta';
import { Deployable, DeployableMixReader, DeployableMixWriter } from '../Deployable';
import { FrameEffectUse } from '../enums';
import { Synergy, SynergyMixReader, SynergyMixWriter } from '../Synergy';

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
    Integrated: string[];
}

export function CreateFrameTrait(data: IFrameTraitData | null): FrameTrait {
    let mb = new MixBuilder<FrameTrait, IFrameTraitData>({});
    mb.with(new RWMix("Name", "name", "Undefined Trait", ident, ident));
    mb.with(new RWMix("Description", "description", "No description", ident, ident));
    mb.with(new RWMix("Use", "use", null, ident, ident_drop_null));

    mb.with(new RWMix("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    mb.with(new RWMix("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    mb.with(new RWMix("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    mb.with(new RWMix("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));
    mb.with(new RWMix("Counters", "counters", [], CountersMixReader, CountersMixWriter));
    mb.with(new RWMix("Integrated", "integrated", [], ident, ident ));

    return mb.finalize(data);
}

