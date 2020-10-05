import _ from "lodash";
import {
    Action,
    Bonus,
    Counter,
    Damage,
    Deployable,
    Range,
    Synergy,
    TagInstance,
    WeaponMod,
    WeaponSize,
    WeaponType,
} from "@/class";
import { IDamageData, IMechEquipmentData, IRangeData, IMechWeaponSaveData, IActionData, IBonusData, ICounterData, IDeployableData, ISynergyData, ITagInstanceData } from "@/interface";
import { ActionsMixReader, ActionsMixWriter, DeployableMixWriter, ident, MixBuilder, RWMix, MixLinks, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid, RangesMixReader, DamagesMixReader, DamagesMixWriter, RangesMixWriter, CountersMixReader, CountersMixWriter, DeployableMixReader, BonusesMixReader, BonusesMixWriter, def_anon, defs, restrict_enum } from '@/mixmeta';
import { getMountType, getWeaponSize, MountType, RangeType } from '../enums';
import { EntryType, Registry, VRegistryItem } from '../registry';

// TODO:
// class WeaponAmmo {}

export interface IMechWeaponData extends IMechEquipmentData {
    id?: string,
  "name": string,
  "source": string, // must be the same as the Manufacturer ID to sort correctly
  "license": string, // reference to the Frame name of the associated license
  "license_level": number, // set to zero for this item to be available to a LL0 character
  "mount": WeaponSize,
  "type": WeaponType,
  "damage"?: IDamageData[],
  "range"?: IRangeData[],
  "tags"?: ITagInstanceData[],
  "sp"?: number,
  "description": string, // v-html
  "effect"?: string // v-html
  "on_attack"?: string // v-html
  "on_hit"?: string // v-html
  "on_crit"?: string // v-html
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[],
  "deployables"?: IDeployableData[],
  "counters"?: ICounterData[],
  "integrated"?: string[]
}

export interface MechWeapon extends MixLinks<IMechWeaponData>, VRegistryItem {
    // Fields. There are a lot - mech equips do be like that
    Type: EntryType.MECH_WEAPON;
    ID: string;
    Name: string;
    Source: string; // MANUFACTURER NAME
    License: string; // FRAME NAME
    LicenseLevel: number;
    Size: WeaponSize;
    WepType: WeaponType;
    BaseDamage: Damage[];
    BaseRange: Range[];
    Tags: TagInstance[];
    SP: number;
    Description: string;
    Effect: string;
    OnAttack: string;
    OnHit: string;
    OnCrit: string;
    Actions: Action[];
    Bonuses: Bonus[];
    Synergies: Synergy[];
    Deployables: Deployable[];
    Counters: Counter[];
    Integrated: string[];

    // This comes not from our data, but from our loadout stuff
    // Mod: WeaponMod;

    // Methods
}

export function CreateMechWeapon(data: IMechWeaponData | null, ctx: Registry): MechWeapon {
    let mb = new MixBuilder<MechWeapon, IMechWeaponData>({});
    mb.with(new RWMix("ID", "id", def_anon, ident ));
    mb.with(new RWMix("Name", "name", defs("New Mech Weapon"), ident));
    mb.with(new RWMix("Source", "source", defs("GMS"), ident));
    mb.with(new RWMix("License", "license", defs("EVEREST"), ident));
    mb.with(new RWMix("LicenseLevel", "license_level", defn(0), ident));
    mb.with(new RWMix("Size", "mount", restrict_enum(WeaponSize, WeaponSize.Main), ident));
    mb.with(new RWMix("Type", "type", ident, ident));
    mb.with(new RWMix("BaseDamage", "damage", DamagesMixReader, DamagesMixWriter));
    mb.with(new RWMix("BaseRange", "range", RangesMixReader, RangesMixWriter));
    mb.with(new RWMix("Tags", "tags", TagInstanceMixReader, TagInstanceMixWriter));
    mb.with(new RWMix("SP", "sp", ident, ident));
    mb.with(new RWMix("Description", "description", ident, ident));
    mb.with(new RWMix("Effect", "effect", ident, ident));
    mb.with(new RWMix("OnAttack", "on_attack", ident, ident));
    mb.with(new RWMix("OnHit", "on_hit", ident, ident));
    mb.with(new RWMix("OnCrit", "on_crit", ident, ident));

    mb.with(new RWMix("Actions", "actions", ActionsMixReader, ActionsMixWriter));
    mb.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, BonusesMixWriter));
    mb.with(new RWMix("Synergies", "synergies", SynergyMixReader, SynergyMixWriter));
    mb.with(new RWMix("Deployables", "deployables", DeployableMixReader, DeployableMixWriter));
    mb.with(new RWMix("Counters", "counters", CountersMixReader, CountersMixWriter));
    mb.with(new RWMix("Integrated", "integrated", ident, ident ));

    return mb.finalize(data);
}

     function TotalSP(this: MechWeapon): number {
        if (!this.Mod) return this.SP;
        return this.Mod.SP + this.SP;
     }

    // function ModSP(): number {
        // return this.Mod ? this.Mod.SP : 0;
    // }

    function DamageType(this: MechWeapon): DamageType[] {
        return this._damage?.map(x => x.Type) || [];
    }

    function DefaultDamageType(this: MechWeapon): DamageType {
        if (0 === this.DamageType.length) {
            return DamageType.Variable;
        } else {
            return this.DamageType[0];
        }
    }

    /*
    public getTotalRange(mech: Mech): Range[] {
        const comp = store.compendium;
        const bonuses = [] as { type: RangeType; val: number }[];
        if (this.Mod && this.Mod.AddedRange)
            bonuses.push({
                type: RangeType.Range,
                val: parseInt(this.Mod.AddedRange.Value),
            });
        if (
            mech.Pilot.has(comp.getReferenceByID("CoreBonuses", "cb_neurolink_targeting")) &&
            !this.IsIntegrated
        )
            bonuses.push({
                type: RangeType.Range,
                val: 3,
            });
        if (
            mech.Pilot.has(comp.getReferenceByID("CoreBonuses", "cb_gyges_frame")) &&
            this.Type === WeaponType.Melee &&
            !this.IsIntegrated
        )
            bonuses.push({
                type: RangeType.Threat,
                val: 1,
            });
        if (
            mech.ActiveLoadout?.HasSystem("ms_external_batteries") &&
            this.Damage[0].Type === DamageType.Energy &&
            !this.IsIntegrated
        )
            if (this.Type === WeaponType.Melee) {
                bonuses.push({
                    type: RangeType.Threat,
                    val: 1,
                });
            } else {
                bonuses.push({
                    type: RangeType.Range,
                    val: 5,
                });
            }
        return Range.AddBonuses(this.Range, bonuses);
    }
    */

    function RangeTypes(this: MechWeapon): RangeType[] {
        return this.Range.map(x => x.Type);
    }
}
