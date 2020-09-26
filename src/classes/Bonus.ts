import { DamageType, Pilot, RangeType, WeaponSize, WeaponType } from '@/class';
import * as pmath from "parsemath";
// Bonuses - we'll need to elaborate on these later... currently they don't work

import { ident, MixBuilder, Mixlet, MixLinks } from '@/mixmeta';

// export type IBonusData = BonusSkillPoint , BonusMechSkillPoint | BonusTalentPoint | BonusLicensePoint | BonusCBPoint | BonusPilotGear | BonusThreat | BonusThreatKinetic | BonusThreatExplosive | BonusThreatEnergy | BonusThreatBurn | BonusRange | BonusRangeKinetic | BonusRangeExplosive | BonusRangeEnergy | BonusRangeBurn | BonusHP | BonusArmor | BonusStructure | BonusStress | BonusHeatcap | BonusCheapStress | BonusCheapStruct | BonusAICap | BonusRepcap | BonusCorePower | BonusEvasion | BonusEDef

// This is gonna be tedious...
export enum BonusType {
          SkillPoint = "skill_point",   // integer
          MechSkillPoint = "mech_skill_point"  , // integer
          TalentPoint = "talent_point"  , // integer
          LicensePoint = "license_point" , // integer
          CoreBonusPoint = "cb_point" , // integer

          Range = "range" , // integer
          Threat = "threat" , // integer
          Damage = "damage" , // integer


          HP = "hp" , // integer
          Armor = "armor" , // integer
          Structure = "structure" , // integer
          Stress = "stress" , // integer
          Heatcap = "heatcap" , // integer
          Repcap = "repcap" , // integer
          CorePower = "core_power" , // integer
          Speed = "speed" , // integer
          Evasion = "evasion" , // integer
          EDef = "edef" , // integer
          Sensor = "sensor" , // integer

          Attack = "attack" , // integer
          TechAttack = "tech_attack" , // integer

          Grapple ="grapple", // integer
          Ram ="ram", // integer
          Save = "save" , // integer
          SP = "sp" , // integer
          Size = "size" , // integer
          AICap = "ai_cap" , // integer
          CheapStruct = "cheap_struct" , // boolean
          CheapStress = "cheap_stress" , // boolean
          Overcharge = "overcharge" , //Overcharge Track 	DieRoll[] as string[]
          LimitedBonus = "limited_bonus" , // integer
          PilotHP = "pilot_hp" , // integer
          PilotArmor = "pilot_armor" , // integer
          PilotEvasion = "pilot_evasion" , // integer
          PilotEDef = "pilot_edef" , // integer
          PilotSpeed = "pilot_speed" , // integer

          PilotGearCap = "pilot_gear_cap" , // integer
          PilotWeaponCap = "pilot_weapon_cap" , // integer


          DeployableHP = "deployable_hp" , // integer
          DeployableSize = "deployable_size" , // integer
          DeployableCharges = "deployable_charges" , // integer
          DeployableArmor = "deployable_armor" , // integer
          DeployableEvasion = "deployable_evasion" , // integer
          DeployableEDef = "deployable_edef" , // integer
          DeployableHeatCap = "deployable_heatcap" , // integer
          DeployableRepairCap = "deployable_repcap" , // integer
          DeployableSensorRange = "deployable_sensor_range" , // integer
          DeployableTechAttack = "deployable_tech_attack" , // integer
          DeployableSave = "deployable_save" , // integer 
          DeployableSpeed = "deployable_speed", //
          Placeholder = "placeholder",
}  // integer

// Lists all of the keys/values, for validation purposes
export const BonusTypeIDList: string[] = Object.keys(BonusType).map(k => BonusType[k as any])

export interface IBonusData {
  id: string;
  value: any
  damage_types?: DamageType[] | null
  range_types?: RangeType[] | null
  weapon_types?: WeaponType[] | null
  weapon_sizes?: WeaponSize[] | null
}


// Todo - uh... more??? It's a bit barebones for now...
export interface Bonus extends MixLinks<IBonusData> {
  // Data
  ID: BonusType,
  Value: any;

  // Methods
  //...
}


export function CreateBonus(data: IBonusData): Bonus {
    let b = new MixBuilder<Bonus, IBonusData>({});
    b.with(new Mixlet("ID", "id", BonusType.Placeholder, ident as any, ident as any)); // The "as any" is necessary because we don't really have a good way of validating these....
    b.with(new Mixlet("Value", "value", 0, ident, ident));


    // Finalize and check. We don't fail
    let r = b.finalize(data);
    if(!BonusTypeIDList.includes(r.ID)) {
      console.error(`Unrecognized bonus type ${r.ID}`);
    }
    return r;
}

// Get the numeric value of a bonus expression, for a given pilot
// Note: Currently very much a WIP
export function Evaluate(bonus: Bonus, pilot: Pilot): number{
    if (typeof bonus.Value === 'number') return Math.ceil(bonus.Value)
    let valStr = bonus.Value
    valStr = valStr.replaceAll(`{ll}`, pilot.Level.toString())
    valStr = valStr.replaceAll(`{grit}`, pilot.Grit.toString())

    return Math.ceil(pmath.parse(valStr));
}


 export function get(id: BonusType, pilot: Pilot): number {
    return pilot.Bonuses.filter(x => x.ID === id).reduce(
      (sum, bonus) => sum + this.Evaluate(bonus, pilot),
      0
    )
  }


// Use these for mixin shorthand elsewhere
export const BonusesMixReader = (x: IBonusData[] | null | undefined) => (x || []).map(CreateBonus);
export const BonusesMixWriter = (x: Bonus[]) => x.map(i => i.Serialize());