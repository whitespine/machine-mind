import { Action, Bonus, Damage, Deployable, ItemType, Synergy, TagInstance, Range } from "@/class";
import { IActionData, IBonusData, IDamageData, IDeployableData, IRangeData, ISynergyData, ITagInstanceData, VCompendiumItem, ICompendiumItemData } from "@/interface";
import { ActionsMixReader, ActionsMixWriter, BonusesMixReader, BonusesMixWriter, DamagesMixReader, DamagesMixWriter, DeployableMixReader, DeployableMixWriter, ident, MixBuilder, RWMix, MixLinks, RangesMixReader, RangesMixWriter, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid } from '@/mixmeta';
import { DEFAULT_BREW_ID } from '../enums';


///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export interface IQuirkData extends ICompendiumItemData {
  id: string,
  name: string, // v-html
  type: "Quirk",
  description: string,
  actions?: IActionData[], // these are only available to UNMOUNTED pilots
  bonuses?: IBonusData[], // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[];
  deployables?: IDeployableData[];
}

export interface Quirk extends MixLinks<IQuirkData>, VCompendiumItem {
    ID: string;
    Name: string;
    Type: ItemType.QUIRK

  Tags: TagInstance[],
  Actions: Action[],
  Bonuses: Bonus[],
  Synergies: Synergy[],
  Deployables: Deployable[],
}

export function CreatePilotArmor(data: IPilotArmorData | null): PilotArmor {
    // Init with deduced cc props
    let b = new MixBuilder<PilotArmor, IPilotArmorData>({
        Brew: DEFAULT_BREW_ID,
        Type: ItemType.PilotArmor
    });

    // Mixin the rest
    b.with(new RWMix("ID", "id", uuid(), ident, ident));
    b.with(new RWMix("Name", "name", "New Armor", ident, ident));

    // Don't need type
    b.with(new RWMix("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

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
    b.with(new RWMix("ID", "id", uuid(), ident, ident));
    b.with(new RWMix("Name", "name", "New Armor", ident, ident));

    b.with(new RWMix("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

    let r = b.finalize(data);
    return r;
}

export interface PilotWeapon extends MixLinks<IPilotWeaponData>, VCompendiumItem {
    Effect: string
    Tags: TagInstance[];
    Range: Range[];
    Damage: Damage[];
    Actions: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies: Synergy[];
    Deployables: Deployable[]; // these are only available to UNMOUNTED pilots
    Type: ItemType.PilotWeapon;
}

export function CreatePilotWeapon(data: IPilotWeaponData | null): PilotWeapon {
    // Init with deduced cc props
    let b = new MixBuilder<PilotWeapon, IPilotWeaponData>({
        Brew: DEFAULT_BREW_ID,
        Type: ItemType.PilotWeapon
    });

    // Mostly the same as the others
    b.with(new RWMix("ID", "id", uuid(), ident, ident));
    b.with(new RWMix("Name", "name", "New Armor", ident, ident));

    b.with(new RWMix("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    b.with(new RWMix("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    b.with(new RWMix("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    b.with(new RWMix("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    b.with(new RWMix("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));

    // Mixin Range and damage
    b.with(new RWMix("Damage", "damage", [], DamagesMixReader, DamagesMixWriter));
    b.with(new RWMix("Range", "range", [], RangesMixReader, RangesMixWriter));

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