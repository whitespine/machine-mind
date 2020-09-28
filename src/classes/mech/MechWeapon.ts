import _ from "lodash";
import {
    Action,
    Bonus,
    Counter,
    Damage,
    DamageType,
    Deployable,
    ItemType,
    Mech,
    MechEquipment,
    MountType,
    Range,
    RangeType,
    Synergy,
    TagInstance,
    WeaponMod,
    WeaponSize,
    WeaponType,
} from "@/class";
import { IDamageData, IMechEquipmentData, IRangeData, IMechWeaponSaveData, IActionData, IBonusData, ICounterData, IDeployableData, ISynergyData, ITagInstanceData } from "@/interface";
import { store } from "@/hooks";
import { ActionsMixReader, ActionsMixWriter, BonusMixReader, BonusMixWriter, DeployableMixReader, DeployableMixWriter, ident, MixBuilder, Mixlet, MixLinks, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter, uuid } from '@/mixmeta';
import { getMountType, getWeaponSize } from '../enums';
import { DamagesMixReader, DamagesMixWriter } from '../Damage';
import { RangesMixReader, RangesMixWriter } from '../Range';
import { CountersMixReader, CountersMixWriter } from '../Counter';

// TODO:
// class WeaponAmmo {}

export interface IMechWeaponData extends IMechEquipmentData {
  // Ss
  "mount": WeaponSize,
  "type": WeaponType,
  "on_attack"?: string // v-html
  "on_hit"?: string // v-html
  "on_crit"?: string // v-html
  "damage"?: IDamageData[],
  "range"?: IRangeData[],
  "profiles"?: Partial<IMechWeaponData>[], // Current profile overrides
  "selected_profile"?: number;
}

export interface MechWeapon extends MixLinks<IMechWeaponData> {
    // Fields. There are a lot - mech equips do be like that
    ID: string;
    Name: string;
    Source: string; // MANUFACTURER NAME
    License: string; // FRAME NAME
    LicenseLevel: number;
    Mount: WeaponSize;
    Type: WeaponType;
    Damage: Damage[];
    Range: Range[];
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

    // Methods


}

export function CreateMechWeapon(data: IMechWeaponData): MechWeapon {
    let mb = new MixBuilder<MechWeapon, IMechWeaponData>({});
    mb.with(new Mixlet("ID", "id", uuid(), ident, ident ));
    mb.with(new Mixlet("Name", "name", "New Weapon", ident, ident));
    mb.with(new Mixlet("Source", "source", "MANUFACTURER", ident, ident));
    mb.with(new Mixlet("License", "license", "LICENSE", ident, ident));
    mb.with(new Mixlet("LicenseLevel", "license_level", 0, ident, ident));
    mb.with(new Mixlet("Mount", "mount", WeaponSize.Main, getWeaponSize, ident));
    mb.with(new Mixlet("Type", "type", WeaponType.Rifle, ident, ident));
    mb.with(new Mixlet("Damage", "damage", [], DamagesMixReader, DamagesMixWriter));
    mb.with(new Mixlet("Range", "range", [], RangesMixReader, RangesMixWriter));
    mb.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter));
    mb.with(new Mixlet("SP", "sp", 0, ident, ident));
    mb.with(new Mixlet("Description", "description", "", ident, ident));
    mb.with(new Mixlet("Effect", "effect", "", ident, ident));
    mb.with(new Mixlet("OnAttack", "on_attack", "", ident, ident));
    mb.with(new Mixlet("OnHit", "on_hit", "", ident, ident));
    mb.with(new Mixlet("OnCrit", "on_crit", "", ident, ident));

    mb.with(new Mixlet("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
    mb.with(new Mixlet("Bonuses", "bonuses", [], BonusMixReader, BonusMixWriter));
    mb.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter));
    mb.with(new Mixlet("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));
    mb.with(new Mixlet("Counters", "counters", [], CountersMixReader, CountersMixWriter));
    mb.with(new Mixlet("Integrated", "integrated", [], ident, ident ));

    return mb.finalize(data);
}

     public get TotalSP(): number {
        // if (!this.Mod) return this.sp;
        // return this.Mod.SP + this.sp;
     }

    // public get ModSP(): number {
        // return this.Mod ? this.Mod.SP : 0;
    // }

    // public get Damage(): Damage[] {
        // if (this._damage && this.Mod && this.Mod.AddedDamage)
            // return this._damage.concat(this.Mod.AddedDamage);
        // return this._damage || [];
    // }

    // public get MaxDamage(): number {
        // if (0 === this.Damage.length) {
            // return 0;
        // } else {
            // return this.Damage[0].Max;
        // }
    // }

    public get DamageTypeOverride(): string {
        return this._custom_damage_type || "";
    }

    public set DamageTypeOverride(val: string) {
        this._custom_damage_type = val;
        this.save();
    }

    public set MaxUseOverride(val: number) {
        this.max_use_override = val;
        this.save();
    }

    public get DamageType(): DamageType[] {
        return this._damage?.map(x => x.Type) || [];
    }

    public get DefaultDamageType(): DamageType {
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

    public get RangeType(): RangeType[] {
        return this._range?.map(x => x.Type) || [];
    }
}
