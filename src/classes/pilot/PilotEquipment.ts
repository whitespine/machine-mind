import { Action, Bonus, Damage, Deployable, Synergy, TagInstance, Range } from "@/class";
import { IActionData, IBonusData, IDamageData, IDeployableData, IRangeData, ISynergyData, ITagInstanceData } from "@/interface";
import { ActionsMixReader, ActionsMixWriter, , DamagesMixWriter, DeployableMixReader, DeployableMixWriter, ident, MixBuilder, RWMix, MixLinks, RangesMixReader, RangesMixWriter, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid } from '@/mixmeta';
import { VRegistryItem } from '../registry;


///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export type IPilotEquipmentData = IPilotWeaponData | IPilotArmorData | IPilotGearData;
export type PilotEquipment = PilotWeapon | PilotArmor | PilotGear;
export interface IPilotWeaponData {
  id: string,
  name: string, // v-html
  type: "Weapon",
  description: string,
  tags: ITagInstanceData[],
  range: IRangeData[],
  damage: IDamageData[],
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[];
  deployables?: IDeployableData[];
}

export interface IPilotArmorData  {
  "id": string,
  "name": string, // v-html
  "type": "Armor",
  "description": string,
  "tags": ITagInstanceData[],
  "actions"?: IActionData[], // these are only available to UNMOUNTED pilots
  "bonuses"?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  "synergies"?: ISynergyData[],
  "deployables"?: IDeployableData[], // these are only available to UNMOUNTED pilots
}

export interface IPilotGearData {
  id: string,
  name: string, // v-html
  type: "Gear",
  description: string,
  tags: ITagInstanceData[],
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[],
  deployables?: IDeployableData[], // these are only available to UNMOUNTED pilots
}

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export interface PilotArmor extends MixLinks<IPilotArmorData>, VRegistryItem {
  Tags: TagInstance[],
  Actions: Action[],
  Bonuses: Bonus[],
  Synergies: Synergy[],
  Deployables: Deployable[],
  Type: EntryType.PilotArmor
}

export function CreatePilotArmor(data: IPilotArmorData | null): PilotArmor {
    // Init with deduced cc props
    let b = new MixBuilder<PilotArmor, IPilotArmorData>({
        Type: EntryType.PilotArmor
    });

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

export interface PilotGear extends MixLinks<IPilotGearData>, VRegistryItem {
    Tags: TagInstance[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: EntryType.PilotGear;
}

export function CreatePilotGear(data: IPilotGearData | null): PilotGear {
    // Init with deduced cc props
    let b = new MixBuilder<PilotGear, IPilotGearData>({
        Type: EntryType.PilotGear
    });

    // Mixin the rest
    b.with(new RWMix("ID", "id", ident, ident));
    b.with(new RWMix("Name", "name", ident, ident));

    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}

export interface PilotWeapon extends MixLinks<IPilotWeaponData>, VRegistryItem {
    Effect: string
    Tags: TagInstance[];
    Range: Range[];
    Damage: Damage[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: EntryType.PilotWeapon;
}

export function CreatePilotWeapon(data: IPilotWeaponData | null): PilotWeapon {
    // Init with deduced cc props
    let b = new MixBuilder<PilotWeapon, IPilotWeaponData>({
        Type: EntryType.PilotWeapon
    });

    // Mostly the same as the others
    b.with(new RWMix("ID", "id", ident, ident));
    b.with(new RWMix("Name", "name", ident, ident));

    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", DeployableMixReader, DeployableMixWriter));

    // Mixin Range and damage
    b.with(new RWMix("Damage", "damage", DamagesMixReader, DamagesMixWriter));
    b.with(new RWMix("Range", "range", RangesMixReader, RangesMixWriter));

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