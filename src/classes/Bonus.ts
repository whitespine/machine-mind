// Bonuses - we'll need to elaborate on these later... currently they don't work

import { Mixin } from "@/class";

// export type IBonusData = BonusSkillPoint | BonusMechSkillPoint | BonusTalentPoint | BonusLicensePoint | BonusCBPoint | BonusPilotGear | BonusThreat | BonusThreatKinetic | BonusThreatExplosive | BonusThreatEnergy | BonusThreatBurn | BonusRange | BonusRangeKinetic | BonusRangeExplosive | BonusRangeEnergy | BonusRangeBurn | BonusHP | BonusArmor | BonusStructure | BonusStress | BonusHeatcap | BonusCheapStress | BonusCheapStruct | BonusAICap | BonusRepcap | BonusCorePower | BonusEvasion | BonusEDef

// This is gonna be tedious...
export type IBonusData =
    | {
          id: "skill_point";
          value: number;
      }
    | {
          id: "mech_skill_point";
          value: number;
      }
    | {
          id: "talent_point";
          value: number;
      }
    | {
          // Add Pilot License point 	integer
          id: "license_point";
          value: number;
      }
    | {
          // Add Pilot CORE Bonus point 	integer
          id: "cb_point";
          value: number;
      }
    | {
          // Add Pilot Gear capacity 	integer
          id: "pilot_gear";
          value: number;
      }
    | {
          // Add threat (all melee weapons) 	integer
          id: "threat";
          value: number;
      }
    | {
          // Add threat (kinetic melee weapons only) 	integer
          id: "threat_kinetic";
          value: number;
      }
    | {
          // Add threat (explosive melee weapons only) 	integer
          id: "threat_explosive";
          value: number;
      }
    | {
          // Add threat (energy melee weapons only) 	integer
          id: "threat_energy";
          value: number;
      }
    | {
          // Add threat (burn melee weapons only) 	integer
          id: "threat_burn";
          value: number;
      }
    | {
          // Add Range (all ranged weapons) 	integer
          id: "range";
          value: number;
      }
    | {
          // Add range (kinetic melee weapons only) 	integer
          id: "range_kinetic";
          value: number;
      }
    | {
          // Add range (explosive melee weapons only) 	integer
          id: "range_explosive";
          value: number;
      }
    | {
          // Add range (energy melee weapons only) 	integer
          id: "range_energy";
          value: number;
      }
    | {
          // Add range (burn melee weapons only) 	integer
          id: "range_burn";
          value: number;
      }
    | {
          // Add Mech HP 	integer
          id: "hp";
          value: number;
      }
    | {
          // Add Mech Armor 	integer
          id: "armor";
          value: number;
      }
    | {
          // Add Mech Structure 	integer
          id: "structure";
          value: number;
      }
    | {
          // Add Mech Reactor Stress 	integer
          id: "stress";
          value: number;
      }
    | {
          // Add Mech Heat Capacity 	integer
          id: "heatcap";
          value: number;
      }
    | {
          // Add Mech Repair Capacity 	integer
          id: "repcap";
          value: number;
      }
    | {
          // Add Mech CORE Power 	integer
          id: "core_power";
          value: number;
      }
    | {
          // Add Mech Speed 	integer
          id: "speed";
          value: number;
      }
    | {
          // Add Mech Evasion 	integer
          id: "evasion";
          value: number;
      }
    | {
          // Add Mech E-Defense 	integer
          id: "edef";
          value: number;
      }
    | {
          // Add Mech Sensor Range 	integer
          id: "sensor";
          value: number;
      }
    | {
          // Add Mech Tech Attack 	integer
          id: "tech_attack";
          value: number;
      }
    | {
          // Add Mech Save 	integer
          id: "save";
          value: number;
      }
    | {
          // Add Mech SP 	integer
          id: "sp";
          value: number;
      }
    | {
          // Add Mech Size 	integer
          id: "size";
          value: number;
      }
    | {
          // Add AI Capacity 	integer
          id: "ai_cap";
          value: number;
      }
    | {
          // Half cost for Structure repairs 	boolean
          id: "cheap_struct";
          value: boolean;
      }
    | {
          // Half cost for Reactor Stress repairs 	boolean
          id: "cheap_stress";
          value: boolean;
      }
    | {
          // Overcharge Track 	DieRoll[]
          id: "overcharge",
          value: string[]
      }
    | {
          // Add Limited equipment uses 	integer
          id: "limited_bonus";
          value: number;
      }
    | {
          // Add Pilot HP 	integer
          id: "pilot_hp";
          value: number;
      }
    | {
          // Add Pilot Armor 	integer
          id: "pilot_armor";
          value: number;
      }
    | {
          // Add Pilot Evasion 	integer
          id: "pilot_evasion";
          value: number;
      }
    | {
          // Add Pilot E-Defense 	integer
          id: "pilot_edef";
          value: number;
      }
    | {
          // Add Pilot Speed 	integer
          id: "pilot_speed";
          value: number;
      }
    | {
          // Add HP to all deployed Drones and Deployables 	integer
          id: "deployable_hp";
          value: number;
      }
    | {
          // Add size to all deployed Drones and Deployables 	integer
          id: "deployable_size";
          value: number;
      }
    | {
          // Add charges to all deployed Drones and Deployables 	integer
          id: "deployable_charges";
          value: number;
      }
    | {
          // Add armor to all deployed Drones and Deployables 	integer
          id: "deployable_armor";
          value: number;
      }
    | {
          // Add evasion to all deployed Drones and Deployables 	integer
          id: "deployable_evasion";
          value: number;
      }
    | {
          // Add edef to all deployed Drones and Deployables 	integer
          id: "deployable_edef";
          value: number;
      }
    | {
          // Add heatcap to all deployed Drones and Deployables 	integer
          id: "deployable_heatcap";
          value: number;
      }
    | {
          // Add repcap to all deployed Drones and Deployables 	integer
          id: "deployable_repcap";
          value: number;
      }
    | {
          // Add sensor range to all deployed Drones and Deployables 	integer
          id: "deployable_sensor_range";
          value: number;
      }
    | {
          // Add tech attack to all deployed Drones and Deployables 	integer
          id: "deployable_tech_attack";
          value: number;
      }
    | {
          // Add save to all deployed Drones and Deployables 	integer
          id: "deployable_save";
          value: number;
      }
    | {
          // Add speed to all deployed Drones and Deployables 	integer
          id: "deployable_speed";
          value: number;
      };

      // Todo - uh... more???
export class Bonus {
    // Don't bother parsing it into anything meaningful - functions better this waay
    public data: IBonusData;

    constructor(data: IBonusData) {
        this.data = data;
    }

    save(): IBonusData {
        return this.data;
    }
}

// Mixin stuff
export interface IHasBonuses {
    bonuses?: IBonusData[] | null;
}

export class MixBonuses extends Mixin<IHasBonuses> {
    private _bonuses: Bonus[] = [];
    public get list(): readonly Bonus[] {
        return this._bonuses;
    }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Bonus> {
        return this._bonuses[Symbol.iterator]();
    }

    public load(data: IHasBonuses) {
        this._bonuses = data.bonuses?.map(a => new Bonus(a)) || [];
    }

    public save(): IHasBonuses {
        return {
            bonuses: this._bonuses.map(b => b.save()),
        };
    }
}
