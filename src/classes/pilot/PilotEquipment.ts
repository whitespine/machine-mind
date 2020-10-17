import { Action, Bonus, Damage, Deployable, Synergy, TagInstance, Range } from "@/class";
import { IActionData, IBonusData, IDamageData, IDeployableData, IRangeData, ISynergyData, ITagInstanceData } from "@/interface";
import { ActionsMixReader, DeployableMixReader, ident, MixBuilder, RWMix, MixLinks, RangesMixReader, SynergyMixReader, TagInstanceMixReader, uuid, BonusesMixReader, defs, def_anon, ident_drop_anon, def, ident_drop_anon_strict, DamagesMixReader, ser_many } from '@/mixmeta.typs';


///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export type IPilotEquipmentData = IPilotWeaponData | IPilotArmorData | IPilotGearData;
export type PackedPilotEquipmentData = PackedPilotWeaponData | PackedPilotArmorData | PackedPilotGearData;
export type PilotEquipment = PilotWeapon | PilotArmor | PilotGear;
export interface RegistryPilotWeaponData {
  id: string
  name: string, // v-html
  type: "Weapon",
  description: string,
  tags: ITagInstanceData[],
  range: IRangeData[],
  damage: IDamageData[],
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[];
  deployables?: RegistryReference<EntryType.DEPLOYABLE>[];
}
// Packed bundles items
export type PackedPilotWeaponData = Omit<RegistryPilotWeaponData, "deployables"> & {deployables: IDeployableData[]};

interface AllPilotArmorData  {
  id: string,
  "name": string, // v-html
  "type": "Armor",
  "description": string,
  "tags": ITagInstanceData[],
  "actions"?: IActionData[], // these are only available to UNMOUNTED pilots
  "bonuses"?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  "synergies"?: ISynergyData[],
}

export interface RegPilotArmorData extends AllPilotArmorData {
  deployables?: RegReference<EntryType.DEPLOYABLE>[];// these are only available to UNMOUNTED pilots
}
export interface PackedPilotArmorData extends AllPilotArmorData {
    deployables: IDeployableData[]
}

export interface RegPilotGearData {
  id: string
  name: string, // v-html
  type: "Gear",
  description: string,
  tags: ITagInstanceData[],
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[],
  deployables?: RegistryReference<EntryType.DEPLOYABLE>[];// these are only available to UNMOUNTED pilots
}
export type PackedPilotGearData = Omit<RegistryPilotArmorData, "deployables"> & {deployables: IDeployableData[]};

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export interface PilotArmor extends VRegistryItem<RegistryPilotArmorData> {
    Name: string;
    MMID: string;
  Tags: TagInstance[],
  Actions: Action[],
  Bonuses: Bonus[],
  Synergies: Synergy[],
  Deployables: Deployable[],
  Type: EntryType.PILOT_ARMOR
}

export function CreatePilotArmor(data: RegistryPilotArmorData | null): PilotArmor {
    // Init with deduced cc props
    let b = new MixBuilder<PilotArmor, RegistryPilotArmorData>({
        Type: EntryType.PILOT_ARMOR
    });

    // Mixin the rest
    b.with(new RWMix("MMID", "id", def_anon, ident_drop_anon));
    b.with(new RWMix("Name", "name", defs("New Armor"), ident));

    // Don't need type
    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, ser_many));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ser_many));
    b.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, ser_many));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, ser_many));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, ser_many));

    let r = b.finalize(data, ctx);
    return r;
}

export interface PilotGear extends VRegistryItem<IPilotGearData> {
    Name: string;
    MMID: string;
    Tags: TagInstance[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: EntryType.PILOT_GEAR;
}

export async function CreatePilotGear(data: IPilotGearData | null, ctx: Registry): Promise<PilotGear> {
    // Init with deduced cc props
    let b = new MixBuilder<PilotGear, IPilotGearData>({
        Type: EntryType.PILOT_GEAR
    });

    // Mixin the rest
    b.with(new RWMix("MMID", "id", ident, ident));
    b.with(new RWMix("Name", "name", ident, ident));

    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, BonusesMixWriter));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data, ctx);
    return r;
}

export interface PilotWeapon extends VRegistryItem<IPilotWeaponData>  {
Name: string;
    MMID: string;
    Effect: string;
    Tags: TagInstance[];
    Range: Range[];
    Damage: Damage[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: EntryType.PILOT_WEAPON;
}

export function CreatePilotWeapon(data: IPilotWeaponData | null): PilotWeapon {
    // Init with deduced cc props
    let b = new MixBuilder<PilotWeapon, IPilotWeaponData>({
        Type: EntryType.PILOT_WEAPON
    });

    // Mostly the same as the others
    b.with(new RWMix("MMID", "id", def_anon, ident_drop_anon));
    b.with(new RWMix("Name", "name", defs("New Pilot Weapon"), ident));

    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, BonusesMixWriter));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, ser_many));

    // Mixin Range and damage
    b.with(new RWMix("Damage", "damage", DamagesMixReader, ser_many));
    b.with(new RWMix("Range", "range", RangesMixReader, ser_many));

    let r = b.finalize(data);
    return r;
}

// TODO: Re-add methods to pilot weapons



/*
    public get DefaultDamageType(): DamageType {
        if (0 === this.Damage.length) {
            return DamageType.Variable;
        } else {
            return this.Damage[0].Type;
        }
    }

    public get MaxDamage(): number {
        if (0 === this.Damage.length) {
            return 0;
        } else {
            return this.Damage[0].Max;
        }
    }

    public get CanSetDamage(): boolean {
        return this._tags.some(x => x.id === "tg_set_damage_type");
    }


}
*/

export function CreatePilotEquipment(data: IPilotEquipmentData, ctx: Registry): PilotEquipment {
    switch(data.type) {
        case "Armor": 
            return CreatePilotEquipment(
    }
}