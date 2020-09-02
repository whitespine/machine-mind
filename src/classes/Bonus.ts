// Bonuses - we'll need to elaborate on these later... currently they don't work

import { Mixin } from '@/class';

// export type IBonusData = BonusSkillPoint | BonusMechSkillPoint | BonusTalentPoint | BonusLicensePoint | BonusCBPoint | BonusPilotGear | BonusThreat | BonusThreatKinetic | BonusThreatExplosive | BonusThreatEnergy | BonusThreatBurn | BonusRange | BonusRangeKinetic | BonusRangeExplosive | BonusRangeEnergy | BonusRangeBurn | BonusHP | BonusArmor | BonusStructure | BonusStress | BonusHeatcap | BonusCheapStress | BonusCheapStruct | BonusAICap | BonusRepcap | BonusCorePower | BonusEvasion | BonusEDef

// This is gonna be tedious...
export interface BonusSkillPoint {
    id: "skill_point",
    value: number
}

export interface BonusMechSkillPoint {
    id: "mech_skill_point",
    value: number
}

export interface BonusTalentPoint {
    id: "talent_point",
    value: number
}

export interface BonusLicensePoint {
	// Add Pilot License point 	integer
    id: "license_point",
}

export interface BonusCBPoint {
    	// Add Pilot CORE Bonus point 	integer
    id: "cb_point",
    }

export interface BonusPilotGear {
    	// Add Pilot Gear capacity 	integer
    id: "pilot_gear",
    }

export interface BonusThreat {
    	// Add threat (all melee weapons) 	integer
    id: "threat",
    }

export interface BonusThreatKinetic {
    	// Add threat (kinetic melee weapons only) 	integer
    id: "threat_kinetic",
    }

export interface BonusThreatExplosive {
    	// Add threat (explosive melee weapons only) 	integer
    id: "threat_explosive",
    }

export interface BonusThreatEnergy {
    	// Add threat (energy melee weapons only) 	integer
    id: "threat_energy",
    }

export interface BonusThreatBurn {
    	// Add threat (burn melee weapons only) 	integer
    id: "threat_burn",
    }

export interface BonusRange {
    	// Add Range (all ranged weapons) 	integer
    id: "range",
    }

export interface BonusRangeKinetic {
    	// Add range (kinetic melee weapons only) 	integer
    id: "range_kinetic",
    }

export interface BonusRangeExplosive {
    	// Add range (explosive melee weapons only) 	integer
    id: "range_explosive",
    }

export interface BonusRangeEnergy {
    	// Add range (energy melee weapons only) 	integer
    id: "range_energy",
    }

export interface BonusRangeBurn {
    	// Add range (burn melee weapons only) 	integer
    id: "range_burn",
    }

export interface BonusHP {
    	// Add Mech HP 	integer
    id: "hp",
    }

export interface BonusArmor {
    	// Add Mech Armor 	integer
    id: "armor",
    }

export interface BonusStructure {
    	// Add Mech Structure 	integer
    id: "structure",
    }

export interface BonusStress {
    	// Add Mech Reactor Stress 	integer
    id: "stress",
    }

export interface BonusHeatcap {
    	// Add Mech Heat Capacity 	integer
    id: "heatcap",
    }

export interface BonusRepcap {
    	// Add Mech Repair Capacity 	integer
    id: "repcap",
    }

export interface BonusCorePower {
    	// Add Mech CORE Power 	integer
    id: "core_power",
    }

export interface BonusSpeed {
    	// Add Mech Speed 	integer
    id: "speed",
    }

export interface BonusEvasion {
    	// Add Mech Evasion 	integer
    id: "evasion",
    }

export interface BonusEDef {
    	// Add Mech E-Defense 	integer
    id: "edef",
    }

export interface BonusSensor {
    	// Add Mech Sensor Range 	integer
    id: "sensor",
    }

export interface BonusTechAttack {
    	// Add Mech Tech Attack 	integer
    id: "tech_attack",
    }

export interface BonusSave {
    	// Add Mech Save 	integer
    id: "save",
    }

export interface BonusSP {
    	// Add Mech SP 	integer
    id: "sp",
    }

export interface BonusSize {
    	// Add Mech Size 	integer
    id: "size",
    }

export interface BonusAICap {
    	// Add AI Capacity 	integer
    id: "ai_cap",
    }

export interface BonusCheapStruct {
    	// Half cost for Structure repairs 	boolean
    id: "cheap_struct",
    }

export interface BonusCheapStress {
    	// Half cost for Reactor Stress repairs 	boolean
    id: "cheap_stress",
    }

export interface BonusOvercharge {
    	// Overcharge Track 	DieRoll[]
    id: "overcharge",
    }

export interface BonusLimited {
    	// Add Limited equipment uses 	integer
    id: "limited_bonus",
    }

export interface BonusPilotHP {
    	// Add Pilot HP 	integer
    id: "pilot_hp",
    }

export interface BonusPilotArmor {
    	// Add Pilot Armor 	integer
    id: "pilot_armor",
    }

export interface BonusPilotEvasion {
    	// Add Pilot Evasion 	integer
    id: "pilot_evasion",
    }

export interface BonusPilotEDef {
    	// Add Pilot E-Defense 	integer
    id: "pilot_edef",
    }

export interface BonusPilotSpeed {
    	// Add Pilot Speed 	integer
    id: "pilot_speed",
    }

export interface BonusDeployableHP {
    	// Add HP to all deployed Drones and Deployables 	integer
    id: "deployable_hp",
    }

export interface BonusDeployableSize {
    	// Add size to all deployed Drones and Deployables 	integer
    id: "deployable_size",
    }

export interface BonusDeployableCharge {
    	// Add charges to all deployed Drones and Deployables 	integer
    id: "deployable_charges",
    }

export interface BonusDeployableArmor {
    	// Add armor to all deployed Drones and Deployables 	integer
    id: "deployable_armor",
    }

export interface BonusDeployableEvasion {
    	// Add evasion to all deployed Drones and Deployables 	integer
    id: "deployable_evasion",
    }

export interface BonusDeployableEDef {
    	// Add edef to all deployed Drones and Deployables 	integer
    id: "deployable_edef",
    }

export interface BonusDeployableHeatcap {
    	// Add heatcap to all deployed Drones and Deployables 	integer
    id: "deployable_heatcap",
    }

export interface BonusDeployableRepcap {
    	// Add repcap to all deployed Drones and Deployables 	integer
    id: "deployable_repcap",
    }

export interface BonusDeployableSensorRange {
    	// Add sensor range to all deployed Drones and Deployables 	integer
    id: "deployable_sensor_range",
    }

export interface BonusDeployableTechAattack {
    	// Add tech attack to all deployed Drones and Deployables 	integer
    id: "deployable_tech_attack",
    }

export interface BonusDeployableSave {
    	// Add save to all deployed Drones and Deployables 	integer
    id: "deployable_save",
    }

export interface BonusDeployableSpeed {
    	// Add speed to all deployed Drones and Deployables 	integer
    id: "deployable_speed",
    }

export class Bonus {
    constructor(data:  IBonusData) {}

    save(): IBonusData {
        return {
            id: "",
            value: ""
        }
    }

}

// Mixin stuff
export interface IHasBonuses {
  bonuses?: IBonusData[] | null,
}

export class MixBonuses extends Mixin<IHasBonuses> {
    private _bonuses: Bonus[] = [];
    public get list(): readonly Bonus[] { return this._bonuses };

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
        }
    }
}