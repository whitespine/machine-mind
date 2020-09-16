import { Action, Bonus, Damage, Deployable, ItemType, Synergy, TagInstance } from "@/class";
import { IActionData, IBonusData, IDamageData, IDeployableData, IRangeData, ISynergyData, ITagInstanceData, VCompendiumItem } from "@/interface";
import { ActionMixReader, ActionMixWriter, BonusMixReader, BonusMixWriter, DeployableMixReader, DeployableMixWriter, ident, MixBuilder, Mixlet, MixLinks, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid } from '@/mixmeta';
import { DEFAULT_BREW_ID } from '../enums';


///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////

export type IPilotEquipmentData = IPilotWeaponData | IPilotArmorData | IPilotGearData;
export interface IPilotWeaponData {
  id: string,
  name: string, // v-html
  type: "Weapon",
  description: string,
  range: IRangeData[],
  damage: IDamageData[],
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
  actions?: IActionData[] | null, // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[] | null, // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[] | null,
  deployables?: IDeployableData[] | null, // these are only available to UNMOUNTED pilots
}

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export interface PilotArmor extends MixLinks<IPilotArmorData>, VCompendiumItem {
  Tags: Tag[],
  Actions: Action[],
  Bonuses: Bonus[],
  Synergies: Synergy[],
  Deployables: Deployable[],
  Type: ItemType.PilotArmor
}


export function CreatePilotArmor(data: IPilotArmorData | null): PilotArmor {
    // Init with deduced cc props
    let b = new MixBuilder<PilotArmor, IPilotArmorData>({
        Brew: DEFAULT_BREW_ID,
        Type: ItemType.PilotArmor
    });

    // Mixin the rest
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Name", "name", "New Armor", ident, ident));

    // Don't need type
    b.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter));
    b.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    b.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    b.with(new Mixlet("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}

export interface PilotGear extends MixLinks<IPilotGearData>, VCompendiumItem {
    Tags: TagInstance[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: ItemType.PilotGear;
}

export function CreatePilotGear(data: IPilotGearData | null): PilotGear {
    // Init with deduced cc props
    let b = new MixBuilder<PilotGear, IPilotGearData>({
        Brew: DEFAULT_BREW_ID,
        Type: ItemType.PilotGear
    });

    // Mixin the rest
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Name", "name", "New Armor", ident, ident));

    b.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter));
    b.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    b.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    b.with(new Mixlet("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}

export interface PilotWeapon extends MixLinks<IPilotWeaponData>, VCompendiumItem {
    Range: Range[];
    Damage: Damage[];
    //Tags: Tag[];
    //Actions: Action[]; // these are only available to UNMOUNTED pilots
    //Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    //Synergies: Synergy[];
    //Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: ItemType.PilotWeapon;
}

export function CreatePilotWeapon(data: IPilotWeaponData | null): PilotWeapon {
    // Init with deduced cc props
    let b = new MixBuilder<PilotWeapon, IPilotWeaponData>({
        Brew: DEFAULT_BREW_ID,
        Type: ItemType.PilotWeapon
    });

    // Mixin the rest
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Name", "name", "New Armor", ident, ident));

    // b.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixReader));
    // b.with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter));
    // b.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    // b.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    // b.with(new Mixlet("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}



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