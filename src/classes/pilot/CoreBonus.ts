import { EntryType, Manufacturer, EquippableMount, Synergy, Bonus, Action, Registry, Counter, Deployable } from "@/class";

import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, VRegistryItem } from "@/interface";
import { ActionsMixReader, BonusesMixReader, def, defs, def_anon, DeployableMixReader, CountersMixReader, ident, ident_drop_anon, ident_drop_null, MixBuilder, MixLinks, RWMix, SynergyMixReader, IntegratedMixReader, ser_many, IntegratedMixWriter } from '@/mixmeta';

export interface ICoreBonusData {
  id?: string,
  "name": string,
  "source": string, // must be the same as the Manufacturer ID to sort correctly
  "effect": string, // v-html
  "description": string, // v-html
  "mounted_effect"?: string
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[]
  "deployables"?: IDeployableData[],
  "counters"?: ICounterData[],
  "integrated"?: string[]
}

export interface CoreBonus extends MixLinks<ICoreBonusData>, VRegistryItem {
  Type: EntryType.CORE_BONUS
  Name: string;
  Source: string;
  Description: string;
  Effect: string;
  MountedEffect: string | null;

  Actions: Action[];
  Bonuses: Bonus[];
  Synergies: Synergy[];
  Deployables: Deployable[];
  Counters: Counter[];
  Integrated: VRegistryItem[]; 
}

export function CreateCoreBonus(data: ICoreBonusData | null, ctx: Registry) {
    // Mixins
    let mb = new MixBuilder<CoreBonus, ICoreBonusData>({
      Type: EntryType.CORE_BONUS
    });
    mb.with(new RWMix("ID", "id", def_anon, ident_drop_anon));
    mb.with(new RWMix("Name", "name", defs("New Core Bonus"), ident));
    mb.with(new RWMix("Source", "source", defs("GMS"), ident));
    mb.with(new RWMix("Effect", "effect", defs("Unknown effect"), ident));
    mb.with(new RWMix("MountedEffect", "mounted_effect", defs("Unknown effect (terse)"), ident_drop_null));

    // Don't need type
    // b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    mb.with(new RWMix("Actions", "actions", ActionsMixReader, ser_many));
    mb.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, ser_many));
    mb.with(new RWMix("Synergies", "synergies", SynergyMixReader, ser_many));
    mb.with(new RWMix("Deployables", "deployables", DeployableMixReader, ser_many));
    mb.with(new RWMix("Counters", "counters", CountersMixReader, ser_many));
    mb.with(new RWMix("Integrated", "integrated", IntegratedMixReader, IntegratedMixWriter));

    return mb.finalize(data, ctx);
}
