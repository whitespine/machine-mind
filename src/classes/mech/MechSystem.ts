import { MechEquipment, SystemType, EntryType, Deployable, Synergy, Bonus, Action, TagInstance } from "@/class";
import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ITagInstanceData } from "@/interface";
import { VRegistryItem } from '../registry';
import { Counter } from '../Counter';
import { MixBuilder, MixLinks } from '@/mixmeta';

export interface IMechSystemData  {
    id?: string,
    "name": string,
    "source": string, // must be the same as the Manufacturer ID to sort correctly
    "license": string, // reference to the Frame name of the associated license
    "license_level": number, // set to zero for this item to be available to a LL0 character
    "type"?: SystemType
    "sp": number,
    "description": string, // v-html
    "tags"?: ITagInstanceData[],
    "effect": string, // v-html
    "actions"?: IActionData[],
    "bonuses"?: IBonusData[]
    "synergies"?: ISynergyData[],
    "deployables"?: IDeployableData[],
    "counters"?: ICounterData[],
    "integrated"?: string[]
  }

export interface MechSystem extends MixLinks<IMechSystemData>, VRegistryItem {
    Name: string;
    Source: string;
    SysType: SystemType;
    License: string;
    LicenseLevel: number;
    Type: SystemType | null;
    SP: number;
    Description: string;
    Effect: string;

    Tags: TagInstance[],
    Actions: Action[],
    Bonuses: Bonus[],
    Counters: Counter[],
    Synergies: Synergy[],
    Deployables: Deployable[],
    Integrated: VRegistryItem[]
}

export function CreateMechSystem {
    let mb = new MixBuilder<MechSystem, IMechSystemData>({});

}