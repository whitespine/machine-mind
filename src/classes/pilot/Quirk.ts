import { Action, Bonus, Damage, Deployable, EntryType, Synergy, TagInstance, Range } from "@/class";
import { IActionData, IBonusData, IDamageData, IDeployableData, IRangeData, ISynergyData, ITagInstanceData, VCompendiumItem, ICompendiumItemData, IQuirkData } from "@/interface";
import { ActionsMixReader, ActionsMixWriter, BonusesMixReader, BonusesMixWriter, DamagesMixReader, DamagesMixWriter, DeployableMixReader, DeployableMixWriter, ident, MixBuilder, RWMix, MixLinks, RangesMixReader, RangesMixWriter, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid } from '@/mixmeta';
import { RegSer } from '@/new_meta';
import { DEFAULT_BREW_ID } from '../enums';


///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
interface AllQuirkData {
  id: string
  name: string, // v-html
  type: "Quirk",
  description: string,
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[];
}

// We unpack these into actors
export interface PackedQuirkData extends AllQuirkData {
  deployables?: IDeployableData[];
}


export interface RegQuirkData extends AllQuirkData {
  // All associated content
  deployables?: IDeployableData[];
}

export class Quirk extends RegSer<EntryType.QUIRK, RegQuirkData> {
  ID: string;
  Name: string;
  Type: EntryType.QUIRK;
  Tags: TagInstance[];
  Actions: Action[];
  Bonuses: Bonus[];
  Synergies: Synergy[];
  Deployables: Deployable[];

  protected load(data: RegQuirkData): Promise<void> {
    throw new Error('Method not implemented.');
  }
  public save(): Promise<RegQuirkData> {
    throw new Error('Method not implemented.');
  }
}

export function CreateQuirk(data: IQuirkData | string | null): Quirk {
    // Init with deduced cc props
    if:

    // Mixin the rest
    b.with(new RWMix("ID", "id", ident, ident));
    b.with(new RWMix("Name", "name", ident, ident));

    // Don't need type
    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}
