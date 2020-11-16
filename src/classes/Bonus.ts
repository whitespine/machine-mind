import { Mech, Pilot } from "@src/class";
import { BonusDict, BonusList } from "./BonusDict";
import { DamageType, RangeType, WeaponSize, WeaponType } from "../enums";
import { SerUtil, SimSer } from "@src/registry";
import * as filtrex from "filtrex";

export interface IBonusData {
    id: string;
    val: string | number;
    damage_types?: DamageType[];
    range_types?: RangeType[];
    weapon_types?: WeaponType[];
    weapon_sizes?: WeaponSize[];
}

export class Bonus {
    // We don't extend simser {
    ID!: string;
    Title!: string | number;
    Detail!: string | number;
    DamageTypes!: DamageType[];
    RangeTypes!: RangeType[];
    WeaponTypes!: WeaponType[];
    WeaponSizes!: WeaponSize[];
    _value!: string | number;
    _value_func!: (v: any) => any;

    // A transient value used for further display information
    Source: string;

    public constructor(data: IBonusData, source: string) {
        this.ID = data.id;
        this.Value = data.val;
        this.DamageTypes = data.damage_types ?? []; // We much prefer these just be empty
        this.RangeTypes = data.range_types ?? [];
        this.WeaponTypes = data.weapon_types ?? [];
        this.WeaponSizes = data.weapon_sizes ?? [];

        // Set our source if need be
        this.Source = source;

        // Check for more metadata.
        const entry = BonusDict.get(data.id);
        this.Title = entry ? entry.title : "UNKNOWN BONUS";
        this.Detail = entry ? this.parse_detail(entry.detail) : "UNKNOWN BONUS";
    }

    // Compile the expression
    public set Value(new_val: string | number) {
        this._value = new_val;

        // Replace ll and bonus
        let val = "" + this.Value;
        val = val.replace(/\{ll\}/g, "ll");
        val = val.replace(/\{grit\}/g, "grit");
        try {
            this._value_func = filtrex.compileExpression(val);
        } catch (e) {
            this._value_func = x => 666;
        }
    }

    public get Value(): string | number {
        return this._value;
    }

    // Just a more convenient constructor
    public static generate(id: string, val: string | number, source: string): Bonus {
        return new Bonus({ id, val }, source);
    }

    public save(): IBonusData {
        return {
            id: this.ID,
            val: this.Value,
            damage_types: SerUtil.drop_empty(this.DamageTypes),
            range_types: SerUtil.drop_empty(this.RangeTypes),
            weapon_types: SerUtil.drop_empty(this.WeaponTypes),
            weapon_sizes: SerUtil.drop_empty(this.WeaponSizes),
        };
    }

    // Formats our detail string to properly show weapon types, damage types, value, etc
    private parse_detail(str: string): string {
        str = str.replace(/{VAL}/g, "" + this.Value);
        str = str.replace(/{INC_DEC}/g, this.Value > -1 ? "Increases" : "Decreases");
        str = str.replace(
            /{RANGE_TYPES}/g,
            ` ${this.RangeTypes.length ? this.RangeTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{DAMAGE_TYPES}/g,
            ` ${this.DamageTypes.length ? this.DamageTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{WEAPON_TYPES}/g,
            ` ${this.WeaponTypes.length ? this.WeaponTypes.join("/").toUpperCase() : ""}`
        );
        str = str.replace(
            /{WEAPON_SIZES}/g,
            ` ${this.WeaponSizes.length ? this.WeaponSizes.join("/").toUpperCase() : ""}`
        );

        return str;
    }

    // Returns this bonus as a numerical value
    public evaluate(pilot: Pilot | null): number {
        let vals = { ll: 0, grit: 0 };
        if (pilot) {
            vals.ll = pilot.Level;
            vals.grit = pilot.Grit;
        }
        return this._value_func(vals);
    }

    // Sums all bonuses on the specific id, for the specified pilot
    public static SumPilotBonuses(
        pilot: Pilot | null,
        bonuses: Bonus[],
        bonus_type: string
    ): number {
        return bonuses
            .filter(x => x.ID === bonus_type)
            .reduce((sum, bonus) => sum + bonus.evaluate(pilot), 0);
    }

    /*
     */
    // Lists contributors for just the mech
}

/*
export enum BonusType {
    SkillPoint = "skill_point", // integer
    MechSkillPoint = "mech_skill_point", // integer
    TalentPoint = "talent_point", // integer
    LicensePoint = "license_point", // integer
    CoreBonusPoint = "cb_point", // integer

    Range = "range", // integer
    Threat = "threat", // integer
    Damage = "damage", // integer

    HP = "hp", // integer
    Armor = "armor", // integer
    Structure = "structure", // integer
    Stress = "stress", // integer
    Heatcap = "heatcap", // integer
    Repcap = "repcap", // integer
    CorePower = "core_power", // integer
    Speed = "speed", // integer
    Evasion = "evasion", // integer
    EDef = "edef", // integer
    Sensor = "sensor", // integer

    Attack = "attack", // integer
    TechAttack = "tech_attack", // integer

    Grapple = "grapple", // integer
    Ram = "ram", // integer
    Save = "save", // integer
    SP = "sp", // integer
    Size = "size", // integer
    AICap = "ai_cap", // integer
    CheapStruct = "cheap_struct", // boolean
    CheapStress = "cheap_stress", // boolean
    Overcharge = "overcharge", //Overcharge Track 	DieRoll[] as string[]
    LimitedBonus = "limited_bonus", // integer
    PilotHP = "pilot_hp", // integer
    PilotArmor = "pilot_armor", // integer
    PilotEvasion = "pilot_evasion", // integer
    PilotEDef = "pilot_edef", // integer
    PilotSpeed = "pilot_speed", // integer

    PilotGearCap = "pilot_gear_cap", // integer
    PilotWeaponCap = "pilot_weapon_cap", // integer

    DeployableHP = "deployable_hp", // integer
    DeployableSize = "deployable_size", // integer
    DeployableCharges = "deployable_charges", // integer
    DeployableArmor = "deployable_armor", // integer
    DeployableEvasion = "deployable_evasion", // integer
    DeployableEDef = "deployable_edef", // integer
    DeployableHeatCap = "deployable_heatcap", // integer
    DeployableRepairCap = "deployable_repcap", // integer
    DeployableSensorRange = "deployable_sensor_range", // integer
    DeployableTechAttack = "deployable_tech_attack", // integer
    DeployableSave = "deployable_save", // integer
    DeployableSpeed = "deployable_speed", //
    Placeholder = "placeholder",
    Unrecognized = "unrecognized",
}
*/
