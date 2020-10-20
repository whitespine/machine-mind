import { MechEquipment, Deployable, Synergy, Bonus, Action, TagInstance, Counter } from "@/class";
import { IActionData, IBonusData, ISynergyData, PackedCounterData, PackedDeployableData, PackedTagInstanceData, RegCounterData, RegDeployableData, RegTagInstanceData, } from "@/interface";
import { EntryType, RegEntry, RegRef } from '@/new_meta';
import { SystemType } from '../enums';

interface AllMechSystemData  {
    id: string,
    "name": string,
    "source": string, // must be the same as the Manufacturer ID to sort correctly
    "license": string, // reference to the Frame name of the associated license
    "license_level": number, // set to zero for this item to be available to a LL0 character
    "type"?: SystemType
    "sp": number,
    "description": string, // v-html
    "effect": string, // v-html
    "actions"?: IActionData[],
    "bonuses"?: IBonusData[]
    "synergies"?: ISynergyData[],
  }

export interface RegMechSystemData extends AllMechSystemData {
    "deployables": RegDeployableData[],
    "integrated": RegRef<any>[]
    "counters": RegCounterData[],
    "tags": RegTagInstanceData[],

}

export interface PackedMechSystemData extends AllMechSystemData {
    "deployables"?: PackedDeployableData[],
    "integrated"?: string[]
    "counters"?: PackedCounterData[],
    "tags"?: PackedTagInstanceData[],

}

export class MechSystem extends RegEntry<EntryType.MECH_SYSTEM, RegMechSystemData> {
    Name!: string;
    Source!: string;
    SysType!: SystemType;
    License!: string;
    LicenseLevel!: number;
    SP!: number;
    Description!: string;
    Effect!: string;

    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Counters!: Counter[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any, any>[];
}

export function CreateMechSystem {
    let mb = new MixBuilder<MechSystem, IMechSystemData>({});

}