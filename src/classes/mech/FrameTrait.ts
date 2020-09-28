import { Action, Bonus, Counter } from '@/class';
import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData} from '@/interface';
import { ActionsMixReader, ActionsMixWriter, BonusMixReader, BonusMixWriter, CountersMixReader, CountersMixWriter, ident, ident_drop_null, MixBuilder, Mixlet, MixLinks } from '@/mixmeta';
import { Deployable, DeployableMixReader, DeployableMixWriter } from '../Deployable';
import { Synergy, SynergyMixReader, SynergyMixWriter } from '../Synergy';



export enum TraitUse {
    Turn = "Turn",
    NextTurn = 'Next Turn',
    Round = 'Round',
    NextRound = 'Next Round',
    Scene = 'Scene' ,
    Encounter = 'Encounter' ,
    Mission= 'Mission',
}
// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

export interface IFrameTraitData {
  "name": string,
  "description": string, // v-html
  "use"?: TraitUse
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
    Use: TraitUse | null;
    Actions: Action[];
    Bonuses: Bonus[]
    Synergies: Synergy[];
    Deployables: Deployable[];
    Counters: Counter[];
    Integrated: string[];
}

export function CreateFrameTrait(data: IFrameTraitData | null) {
    let mb = new MixBuilder<FrameTrait, IFrameTraitData>({});
    mb.with(new Mixlet("Name", "name", "Undefined Trait", ident, ident));
    mb.with(new Mixlet("Description", "description", "No description", ident, ident));
    mb.with(new Mixlet("Use", "use", null, ident, ident_drop_null)); // Sub unrecognized for null

    mb.with(new Mixlet("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    mb.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    mb.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    mb.with(new Mixlet("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));
    mb.with(new Mixlet("Counters", "counters", [], CountersMixReader, CountersMixWriter));
    mb.with(new Mixlet("Integrated", "integrated", [], ident, ident ));

}

