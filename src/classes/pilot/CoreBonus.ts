import {
    Synergy,
    Bonus,
    Action,
    Registry,
    Counter,
    Deployable,
} from "@/class";

import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
} from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, RegSer } from '@/new_meta';
import { RegCounterData } from "../Counter";

// This is what compcon gives us. It is not what we store
interface AllCoreBonusData {
    id: string;
    name: string;
    source: string; // must be the same as the Manufacturer ID to sort correctly
    effect: string; // v-html
    description: string; // v-html
    mounted_effect?: string;
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];

}
export interface PackedCoreBonusData extends AllCoreBonusData {
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
}

export interface RegCoreBonusData extends AllCoreBonusData {
    deployables?: RegRef<EntryType.DEPLOYABLE>[];
    counters?: RegCounterData[];
    integrated?: RegRef<any>[];
}

export class CoreBonus extends RegEntry<EntryType.CORE_BONUS, RegCoreBonusData> {
  ID!: string;
    Name!: string;
    Source!: string;
    Description!: string;
    Effect!: string;
    MountedEffect!: string | null;

    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];

    protected async load(data: RegCoreBonusData): Promise<void> {
      this.ID = data.id;
      this.Name = data.name;
      this.Source = data.source;
      this.Description = data.description;
      this.Effect = data.effect;
      this.MountedEffect = data.mounted_effect ?? null;
      this.Actions = data.actions?.map(x => new Action(x)) || [];
      this.Bonuses = data.bonuses?.map(b => new Bonus(b)) || [];
      this.Synergies = data.synergies?.map(s => new Synergy(s)) || [];
      this.Deployables = await this.Registry.resolve_many(data.deployables || []);
      this.Counters = data.counters?.map(c => new Counter(c)) || [];
      this.Integrated = await this.Registry.resolve_many(data.integrated || []);
    }
    public async save(): Promise<RegCoreBonusData> {
      return {
        description: this.Description,
        effect: this.Effect,
        id: this.ID,
        name: this.Name,
        source: this.Source,
        actions: this.Actions.map(a => a.save()),
        bonuses: this.Bonuses.map(b => b.save()),
        counters: this.Counters.map(c => c.save()),
        deployables: this.Deployables.map(d => d.as_ref()),
        integrated: this.Integrated.map(i => i.as_ref()),
        mounted_effect: this.MountedEffect ?? undefined,
        synergies: this.Synergies.map(s => s.save())
      }
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(cor: PackedCoreBonusData, reg: Registry): Promise<CoreBonus>{
      let deployables = (cor.deployables || []).map(d => Deployable.unpack(d, reg));
      let integrated = 
      return {
        ...cor,

      }
    }
}

