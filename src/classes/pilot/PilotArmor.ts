import { PilotEquipment, ItemType, Action, Tag,} from "@/class";
import { IPilotEquipmentData, ITagged, ITagData, IActionData, IBonusData, ISynergyData, IDeployableData } from "@/interface";
import { CompendiumItem } from '../CompendiumItem';
import { MixinHostData, MixBuilder, Mixlet } from '@/mixmeta';
import { ActionMixReader, ActionMixWriter } from '../Action';
import { Synergy } from '../Synergy';
import { Deployable } from '../Deployable';
import { identity, uniqueId } from 'lodash';

export interface IPilotArmorData {
  "id": string,
  "name": string, // v-html
  "type": "Armor",
  "description": string,
  "tags": ITagData[],
  "actions"?: IActionData[], // these are only available to UNMOUNTED pilots
  "bonuses"?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  "synergies"?: ISynergyData[],
  "deployables"?: IDeployableData[], // these are only available to UNMOUNTED pilots
},

export interface PilotArmor extends MixinHostData<IPilotArmorData> {
  id: string,
  name: string,
  Tags: Tag[],
  Actions: Action[],
  Bonuses: Bonus[],
  Synergies: Synergy[],
  Deployables: Deployable[]
}

type RawHasActionsAndStuff = object & {
    actions: IActionData[]
}

interface ClassHasActionsAndStuff extends MixinHostData<RawHasActionsAndStuff> {
    Actions: Action[]
}

export function MakePilotArmor(from_data?: IPilotArmorData): PilotArmor {
    let b = new MixBuilder<PilotArmor, IPilotArmorData>({});
    b.with(new Mixlet("name", "name", "New Armor", identity, identity));
    b.with(new Mixlet("id", "id", uniqueId(), identity, identity));
    b.with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter));
    b.with(with

}