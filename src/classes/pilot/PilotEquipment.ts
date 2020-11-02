import { Action, Bonus, Damage, Deployable, Synergy, TagInstance, Range } from "@/class";
import {
    IActionData,
    IBonusData,
    IRangeData,
    ISynergyData,
    PackedDamageData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegTagInstanceData,
} from "@/interface";
import { EntryType, RegEntry, RegRef } from "@/registry";

///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export type RegPilotEquipmentData = RegPilotArmorData | RegPilotWeaponData | RegPilotGearData;
export type PackedPilotEquipmentData =
    | PackedPilotWeaponData
    | PackedPilotArmorData
    | PackedPilotGearData;
export type PilotEquipment = PilotWeapon | PilotArmor | PilotGear;


interface AllPilotWeaponData {
    id: string;
    name: string; // v-html
    description: string;
    range: IRangeData[];
    actions?: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];
}
export interface RegPilotWeaponData extends AllPilotWeaponData {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    tags: RegTagInstanceData[];
}
// Packed bundles items
export interface PackedPilotWeaponData extends AllPilotWeaponData {
    type: "Weapon";
    deployables: PackedDeployableData[];
    damage: PackedDamageData[];
    tags: PackedTagInstanceData[];
};

interface AllPilotArmorData {
    id: string;
    name: string; // v-html
    description: string;
    actions?: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];
}

export interface RegPilotArmorData extends AllPilotArmorData {
    deployables: RegRef<EntryType.DEPLOYABLE>[]; // these are only available to UNMOUNTED pilots
    tags: RegTagInstanceData[];
}
export interface PackedPilotArmorData extends AllPilotArmorData {
    type: "Armor";
    tags: PackedTagInstanceData[];
    deployables: PackedDeployableData[];
}

 interface AllPilotGearData {
    id: string;
    name: string; // v-html
    description: string;
    actions?: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];
}

export interface RegPilotGearData  extends  AllPilotGearData {
    deployables: RegRef<EntryType.DEPLOYABLE>[]; // these are only available to UNMOUNTED pilots
    tags: RegTagInstanceData[];
}

export interface PackedPilotGearData extends AllPilotGearData {
    type: "Gear";
    tags: PackedTagInstanceData[];
    deployables: PackedDeployableData[];
};

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export class PilotArmor extends RegEntry<EntryType.PILOT_ARMOR, RegPilotArmorData> {
    Name!: string;
    ID!: string;
    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    protected load(data: RegPilotArmorData): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public save(): Promise<RegPilotArmorData> {
        throw new Error("Method not implemented.");
    }
}

export class PilotGear extends RegEntry<EntryType.PILOT_GEAR, RegPilotGearData> {
    Name!: string;
    ID!: string;
    Tags!: TagInstance[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots
    Type!: EntryType.PILOT_GEAR;
    protected load(data: RegPilotGearData): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public save(): Promise<RegPilotGearData> {
        throw new Error("Method not implemented.");
    }
}

export class PilotWeapon extends RegEntry<EntryType.PILOT_WEAPON, RegPilotWeaponData> {
    Name!: string;
    ID!: string;
    Effect!: string;
    Tags!: TagInstance[];
    Range!: Range[];
    Damage!: Damage[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots
    protected load(data: RegPilotWeaponData): Promise<void> {
        throw new Error("Method not implemented.");
    }
    public save(): Promise<RegPilotWeaponData> {
        throw new Error("Method not implemented.");
    }
}
