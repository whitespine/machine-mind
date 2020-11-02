import { Action, Bonus, Counter, Synergy } from '@/class';
import { IActionData, IBonusData, ISynergyData, IDeployableData, PackedCounterData, RegCounterData} from '@/interface';
import { EntryType, RegEntry, RegRef } from '@/registry';
import { Deployable } from '../Deployable';
import { FrameEffectUse } from '../enums';

// const TraitUseList: TraitUse[] = Object.keys(TraitUse).map(k => TraitUse[k as any])

interface AllFrameTraitData {
  "name": string,
  "description": string, // v-html
  "use"?: FrameEffectUse
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[]
}

export interface PackedFrameTraitData extends AllFrameTraitData {
  "integrated"?: string[] 
  "counters"?: PackedCounterData[],
  "deployables"?: IDeployableData[],

}

export interface RegFrameTraitData extends AllFrameTraitData {
  counters: RegCounterData[];
  integrated: RegRef<any>[];
  deployables: RegRef<EntryType.DEPLOYABLE>[];
}

export class FrameTrait extends RegEntry<EntryType.FRAME_TRAIT, RegFrameTraitData> {
    Name!: string;
    Description!: string;
    Use!: FrameEffectUse | null;
    Actions!: Action[];
    Bonuses!: Bonus[]
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];


    protected async load(data: RegFrameTraitData): Promise<void> {
      this.Name = data.name;
      this.Description = data.description;
      this.Use = data.use ?? null;
      this.Actions = data.actions?.map(a => new Action(a)) || [];
      this.Bonuses = data.bonuses?.map(b => new Bonus(b)) || [];
      this.Synergies = data.synergies?.map(s => new Synergy(s)) || [];
      this.Deployables = await Promise.all(data.deployables?.map(d => this.Registry.resolve(d)));
    }

    public save(): Promise<RegFrameTraitData> {
      throw new Error('Method not implemented.');
    }


}


