import {
    Action,
    Bonus,
    CoreBonus,
    Counter,
    Damage,
    Deployable,
    Frame,
    MechLoadout,
    MechSystem,
    MechWeapon,
    Pilot,
    Rules,
    Status,
    Synergy,
} from "@src/class";
import { bound_int } from "@src/funcs";
import { PackedMechLoadoutData, RegMechLoadoutData } from "@src/interface";
import { EntryType, InventoriedRegEntry, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { DamageType } from "../enums";
import { WeaponMod } from "./WeaponMod";

interface AllMechData {
    id: string;
    name: string;
    notes: string;
    gm_note: string;
    portrait: string;
    cloud_portrait: string;
    active: boolean;
    current_structure: number;
    current_hp: number;
    overshield: number;
    current_stress: number;
    current_heat: number;
    current_repairs: number;
    current_overcharge: number;
    current_core_energy: number;
    burn: number;
    ejected: boolean;
    activations: number;
    meltdown_imminent: boolean; // TODO: Make this active effect
    cc_ver: string;
    core_active: boolean;
}

export interface PackedMechData extends AllMechData {
    frame: string;
    statuses: string[];
    conditions: string[];
    resistances: string[];
    reactions: string[];
    loadouts: PackedMechLoadoutData[];
    active_loadout_index: number;

    // These are easily deduced and thus not kept
    reactor_destroyed: boolean;
    destroyed: boolean;
    defeat: string;
}

export interface RegMechData extends AllMechData {
    frame: RegRef<EntryType.FRAME>;
    statuses_and_conditions: RegRef<EntryType.STATUS>[]; // Also includes conditions
    resistances: DamageType[];
    //reactions: RegRef<EntryType.ACTION>[]
    reactions: string[];
    loadout: RegMechLoadoutData; // We only support one, for now
}

export class Mech extends InventoriedRegEntry<EntryType.MECH, RegMechData> {
    ID!: string;
    Name!: string;
    Notes!: string;
    GmNote!: string;
    Portrait!: string;
    CloudPortrait!: string;
    BuiltInImg!: string;
    Frame!: Frame;
    Loadout!: MechLoadout;
    private _current_structure!: number; // Get set elsewhere to bound
    private _current_stress!: number;
    Overshield!: number;
    CurrentHeat!: number;
    CurrentHP!: number;
    CurrentRepairs!: number;
    CurrentCoreEnergy!: number;
    CurrentOvercharge!: number;
    Activations!: number;
    Active!: boolean;
    Pilot!: Pilot;
    Cc_ver!: string;
    StatusesAndConditions!: Status[];
    Resistances!: DamageType[];
    Reactions!: string[]; // I haven't decided what I want to do with this yet. for now just names?
    Ejected!: boolean;
    MeltdownImminent!: boolean;
    Burn!: number;
    CoreActive!: boolean; // Are core bonuses currently in effect

    // These are posessed systems/weapons/etc of the frame that are not necessarily equipped.
    // Good for if your players like to reflavor their items.
    // Everything in MechLoadout should just be reffing to these items (avoid making duplicates - an easy mistake to make but one that will ultimately become very annoying)
    OwnedWeapons!: MechWeapon[];
    OwnedSystems!: MechSystem[];
    OwnedWeaponMods!: WeaponMod[];

    // Per turn data
    TurnActions!: number;
    CurrentMove!: number;

    // -- Info --------------------------------------------------------------------------------------
    public get Icon(): string {
        return "cci-pilot";
    }

    public get IsCascading(): boolean {
        return !!this.Loadout.Equipment.filter(x => x.Cascading).length;
    }

    /*
    public get RequiredLicenses(): ILicenseRequirement[] {
        const requirements = this.Loadout.RequiredLicenses;

        //TODO: change from GMS to LL0
        if (this.Frame.ID === "mf_standard_pattern_i_everest") {
            const gmsIdx = requirements.findIndex(x => x.source === "GMS");
            if (gmsIdx > -1) requirements[gmsIdx].items.push('STANDARD PATTERN I "EVEREST" Frame');
            else requirements.push(this.Frame.RequiredLicense);
        } else {
            const reqIdx = requirements.findIndex(
                x => x.name === `${this.Frame.Name}` && x.rank === 2
            );
            if (reqIdx > -1)
                requirements[reqIdx].items.push(`${this.Frame.Name.toUpperCase()} Frame`);
            else requirements.push(this.Frame.RequiredLicense);
        }

        for (const l of requirements) {
            if (l.source === "GMS") continue;
            l.missing = !this.Pilot.has("License", l.name, l.rank);
        }

        return requirements.sort((a, b) => {
            return a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0;
        });
    }
    */

    // -- Attributes --------------------------------------------------------------------------------
    public get SizeIcon(): string {
        return `cci-size-${this.Size === 0.5 ? "half" : this.Size}`;
    }

    public get Size(): number {
        const bonus = this.sum_bonuses("size");
        const size = Math.ceil(this.Frame.Stats.size + bonus);
        return bound_int(size, 0.5, Rules.MaxFrameSize);
    }

    public get Armor(): number {
        const bonus = this.sum_bonuses("armor");
        const armor = this.Frame.Stats.armor + bonus;
        return bound_int(armor, 0, Rules.MaxMechArmor);
    }

    public get SaveTarget(): number {
        const bonus = this.sum_bonuses("save");
        return this.Frame.Stats.save + bonus;
    }

    public get Evasion(): number {
        // if (this.IsStunned) return 5;
        // TODO - allow status bonuses to override somehow
        const bonus = this.sum_bonuses("evade");
        return this.Frame.Stats.evasion + bonus;
    }

    public get Speed(): number {
        const bonus = this.sum_bonuses("speed");
        return this.Frame.Stats.speed + bonus;
    }

    public get SensorRange(): number {
        const bonus = this.sum_bonuses("sensor");
        return this.Frame.Stats.sensor_range + bonus;
    }

    public get EDefense(): number {
        const bonus = this.sum_bonuses("edef");
        return this.Frame.Stats.edef + bonus;
    }

    public get LimitedBonus(): number {
        const bonus = this.sum_bonuses("limited_bonus");
        return bonus;
    }

    public get AttackBonus(): number {
        const bonus = this.sum_bonuses("attack");
        return bonus;
    }

    public get TechAttack(): number {
        const bonus = this.sum_bonuses("tech_attack");
        return this.Frame.Stats.tech_attack + bonus;
    }

    public get Grapple(): number {
        const bonus = this.sum_bonuses("grapple");
        return Rules.BaseGrapple + bonus;
    }

    public get Ram(): number {
        const bonus = this.sum_bonuses("ram");
        return Rules.BaseRam + bonus;
    }

    public get SaveBonus(): number {
        const bonus = this.sum_bonuses("save");
        return bonus;
    }

    // -- HASE --------------------------------------------------------------------------------------
    public get Hull(): number {
        return this.Pilot.MechSkills.Hull;
    }

    public get Agi(): number {
        return this.Pilot.MechSkills.Agi;
    }

    public get Sys(): number {
        return this.Pilot.MechSkills.Sys;
    }

    public get Eng(): number {
        return this.Pilot.MechSkills.Eng;
    }

    // -- Stats -------------------------------------------------------------------------------------
    public get CurrentStructure(): number {
        return this._current_structure;
    }

    public set CurrentStructure(structure: number) {
        this._current_structure = bound_int(structure, 0, this.MaxStructure);
    }

    public get MaxStructure(): number {
        const bonus = this.sum_bonuses("structure");
        return this.Frame.Stats.structure + bonus;
    }
    // Applies damage to this mech, factoring in resistances. Does not handle structure. Do that yourself, however you feel is appropriate!
    /*
    public ApplyDamage(type: DamageType, val: number, shredded: boolean): void {
        let val = dmg.Value;
        if (this.Resistances.includes(dmg.DamageType)) {
            val = Math.ceil(val / 2);
        }
        this.CurrentHP -= val;
    }
    */

    public get MaxHP(): number {
        const bonus = this.sum_bonuses("hp");
        return this.Frame.Stats.hp + bonus;
    }

    public get CurrentSP(): number {
        return this.Loadout.TotalSP;
    }

    public get MaxSP(): number {
        return this.Frame.Stats.sp + this.sum_bonuses("sp");
    }

    public get FreeSP(): number {
        return this.MaxSP - this.CurrentSP;
    }

    /*
    public AddHeat(heat: number): void {
        heat = this.Resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        let newHeat = this.CurrentHeat + heat;
        while (newHeat > this.Stats.heatcapacity) {
            this.CurrentStress -= 1;
            newHeat -= this.Stats.heatcapacity;
        }
        this.CurrentHeat = newHeat;
    }

    public ReduceHeat(heat: number, resist?: boolean): void {
        if (resist) heat = this.Resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        while (heat > this.CurrentHeat) {
            heat -= this.CurrentHeat;
            this.CurrentStress += 1;
            this.CurrentHeat = this.Stats.heatcapacity;
        }
        this.CurrentHeat -= heat;
    }
    */

    public get IsInDangerZone(): boolean {
        return this.CurrentHeat >= Math.ceil(this.HeatCapacity / 2);
    }

    public get HeatCapacity(): number {
        return this.Frame.Stats.heatcap + this.sum_bonuses("heatcap");
    }

    public get CurrentStress(): number {
        return this._current_stress;
    }

    public set CurrentStress(stress: number) {
        this._current_stress = bound_int(stress, 0, this.MaxStress);
    }

    public get MaxStress(): number {
        return this.Frame.Stats.stress + this.sum_bonuses("stress");
    }

    public get RepairCapacity(): number {
        return this.Frame.Stats.repcap + this.sum_bonuses("repcap");
    }

    public AddReaction(r: string): void {
        this.Reactions.push(r);
    }

    public RemoveReaction(r: string): void {
        const idx = this.Reactions.findIndex(x => x === r);
        if (idx > -1) this.Reactions.splice(idx, 1);
    }

    // Refresh our basic per-turns. More work definitely to be done here!
    public NewTurn(): void {
        this.Activations = 1;
        this.TurnActions = 2;
        this.CurrentMove = this.Frame.Stats.speed;
    }

    // -- Statuses and Conditions -------------------------------------------------------------------
    public get StatusString(): string[] {
        const out: string[] = [];
        if (this.ReactorDestroyed) out.push("Reactor Destroyed");
        if (this.Destroyed) out.push("Destroyed");
        if (this.Ejected) out.push("Ejected");
        if (this.MeltdownImminent) out.push("Meltdown");
        if (this.Loadout.Systems.filter(x => x.Cascading).length) out.push("Cascading");
        if (this.FreeSP < 0) out.push("Over SP");
        if (this.FreeSP > 0) out.push("Under SP");
        if (this.Loadout.HasEmptyMounts) out.push("Unfinished");
        // if (this.RequiredLicenses.filter(x => x.missing).length) out.push("Unlicensed"); // TODO
        return out;
    }

    public get Destroyed(): boolean {
        return this.CurrentStructure == 0;
    }

    public get ReactorDestroyed(): boolean {
        return this.CurrentStress == 0;
    }

    // Repair from destroyed
    public RepairDestroyed(): void {
        this.MeltdownImminent = false;
        this.StatusesAndConditions = [];
        this.CurrentStress = 1;
        this.CurrentStructure = 1;
        this.CurrentHP = this.MaxHP;
    }

    // -- Active Mode Utilities ---------------------------------------------------------------------
    public FullRepair(): void {
        this.CurrentStructure = this.MaxStructure;
        this.CurrentHP = this.MaxHP;
        this.CurrentStress = this.MaxStress;
        this.CurrentHeat = 0;
        this.CurrentRepairs = this.RepairCapacity;
        this.CurrentCoreEnergy = 1;
        this.CurrentOvercharge = 0;
        this.Loadout.Equipment.forEach(y => {
            y.Destroyed = false;
            // let lim_max =
            // if (y.IsLimited) y.Uses = y.getTotalUses(this.LimitedBonus);
            // TODO
        });
        this.StatusesAndConditions = [];
        this.Resistances = [];
        this.Burn = 0;
        this.MeltdownImminent = false;
    }

    // -- Loadouts ----------------------------------------------------------------------------------

    // -- Bonuses, Actions, Synergies, etc. ---------------------------------------------------------
    // All bonuses supplied by this mech and its equipment.
    // Named such to disambiguate from any inherited pilot bonuses (e.x. core bonus, HASE, or talent data)
    // In some cases we still want destroyed equipment, most notably with deployables
    private mech_feature_sources(
        include_destroyed: boolean
    ): Array<{
        Bonuses?: Bonus[];
        Actions?: Action[];
        Synergies?: Synergy[];
        Deployables?: Deployable[];
        Counters?: Counter[];
    }> {
        let output: Array<{
            Bonuses?: Bonus[];
            Actions?: Action[];
            Synergies?: Synergy[];
            Deployaables?: Deployable[];
            Counters?: Counter[];
        }> = [];

        // Get from equipment
        for (let item of this.Loadout.Equipment) {
            if (include_destroyed || (!item.Destroyed && !item.Cascading)) {
                output.push(item);
            }
        }

        // Get from frame traits
        output.push(...this.Frame.Traits);

        // Get from core passive/active. Gotta do a remap
        if (this.Frame.CoreSystem) {
            output.push({
                Bonuses: this.Frame.CoreSystem.PassiveBonuses ?? [],
                Actions: this.Frame.CoreSystem.PassiveActions ?? [],
                Synergies: this.Frame.CoreSystem.PassiveSynergies ?? [],
            });

            if (this.CoreActive) {
                output.push({
                    Bonuses: this.Frame.CoreSystem.ActiveBonuses ?? [],
                    Actions: this.Frame.CoreSystem.ActiveActions ?? [],
                    Synergies: this.Frame.CoreSystem.ActiveSynergies ?? [],
                });
            }
        }

        return output;
    }

    public get MechBonuses(): Bonus[] {
        return this.mech_feature_sources(false).flatMap(x => x.Bonuses ?? []);
    }

    public get MechSynergies(): Synergy[] {
        return this.mech_feature_sources(false).flatMap(x => x.Synergies ?? []);
    }

    public get MechActions(): Action[] {
        return this.mech_feature_sources(false).flatMap(x => x.Actions ?? []);
    }

    public get MechDeployables(): Deployable[] {
        return this.mech_feature_sources(true).flatMap(x => x.Deployables ?? []);
    }

    public get MechCounters(): Counter[] {
        return this.mech_feature_sources(true).flatMap(x => x.Counters ?? []);
    }

    // -- I/O ---------------------------------------------------------------------------------------
    public async save(): Promise<RegMechData> {
        return {
            id: this.ID,
            name: this.Name,
            notes: this.Notes,
            gm_note: this.GmNote,
            portrait: this.Portrait,
            cloud_portrait: this.CloudPortrait,
            frame: this.Frame.as_ref(),
            active: this.Active,
            current_structure: this.CurrentStructure,
            current_hp: this.CurrentHP,
            overshield: this.Overshield,
            current_stress: this._current_stress,
            current_heat: this.CurrentHeat,
            current_repairs: this.CurrentRepairs,
            current_overcharge: this.CurrentOvercharge,
            current_core_energy: this.CurrentCoreEnergy,
            core_active: this.CoreActive,
            statuses_and_conditions: SerUtil.ref_all(this.StatusesAndConditions),
            resistances: this.Resistances,
            reactions: this.Reactions,
            burn: this.Burn,
            ejected: this.Ejected,
            activations: this.Activations,
            meltdown_imminent: this.MeltdownImminent,
            cc_ver: "MM-0",
            loadout: await this.Loadout.save(),
        };
    }

    public async load(data: RegMechData): Promise<void> {
        let subreg = await this.inventory_reg();
        this.ID = data.id;
        this.Name = data.name;
        this.Notes = data.notes;
        this.GmNote = data.gm_note;
        this.Portrait = data.portrait;
        this.CloudPortrait = data.cloud_portrait;
        this.Active = data.active;
        this.Loadout = await new MechLoadout(subreg, data.loadout).ready();
        this.CurrentStructure = data.current_structure;
        this.CurrentHP = data.current_hp;
        this.Overshield = data.overshield || 0;
        this._current_stress = data.current_stress;
        this.CurrentHeat = data.current_heat;
        this.CurrentRepairs = data.current_repairs;
        this.CurrentOvercharge = data.current_overcharge || 0;
        this.CurrentCoreEnergy = data.current_core_energy ?? 1;
        this.StatusesAndConditions = await subreg.resolve_many(data.statuses_and_conditions || []);
        this.Resistances = data.resistances || [];
        this.Reactions = data.reactions || [];
        this.Burn = data.burn || 0;
        this.Ejected = data.ejected || false;
        this.Activations = data.activations || 1;
        this.MeltdownImminent = data.meltdown_imminent || false;
        this.CoreActive = data.core_active || false;
    }

    // All bonuses affecting this mech, from itself, its pilot, and (todo) any status effects
    public get AllBonuses(): Bonus[] {
        return [...this.Pilot.PilotBonuses, ...this.MechBonuses];
    }

    // Sum our pilot bonuses and our intrinsic bonuses for one big honkin bonus for the specified id, return the number
    private sum_bonuses(id: string): number {
        return Bonus.SumPilotBonuses(this.Pilot, this.AllBonuses, id);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [
            this.Frame,
            ...this.OwnedSystems,
            ...this.OwnedWeapons,
            ...this.OwnedWeaponMods,
            ...this.StatusesAndConditions,
        ];
    }
}

export async function mech_cloud_sync(
    data: PackedMechData,
    mech: Mech,
    compendium_reg: Registry
): Promise<void> {}
