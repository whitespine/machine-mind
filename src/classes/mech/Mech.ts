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
import { bound_int, defaults } from "@src/funcs";
import { PackedMechLoadoutData, RegMechLoadoutData } from "@src/interface";
import {
    EntryType,
    InventoriedRegEntry,
    LiveEntryTypes,
    OpCtx,
    quick_mm_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { CC_VERSION, DamageType } from "../../enums";
import { CovetousCatStack, CovetousReg } from "../regstack";
// import { RegStack } from '../regstack';
import { WeaponMod } from "./WeaponMod";

interface AllMechData {
    id: string;
    name: string;
    notes: string;
    gm_note: string;
    portrait: string;
    cloud_portrait: string;
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
    active: boolean;
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
    pilot: RegRef<EntryType.PILOT> | null;
    resistances: DamageType[];
    //reactions: RegRef<EntryType.ACTION>[]
    reactions: string[];
    loadout: RegMechLoadoutData; // We only support one, for now
}

export class Mech extends InventoriedRegEntry<EntryType.MECH> {
    ID!: string;
    Name!: string;
    Notes!: string;
    GmNote!: string;
    Portrait!: string;
    CloudPortrait!: string;
    BuiltInImg!: string;
    Loadout!: MechLoadout;
    CurrentStructure!: number; // Get set elsewhere to bound
    CurrentStress!: number;
    Overshield!: number;
    CurrentHeat!: number;
    CurrentHP!: number;
    CurrentRepairs!: number;
    CurrentCoreEnergy!: number;
    CurrentOvercharge!: number;
    Activations!: number;
    Pilot!: Pilot | null; // We want to avoid the null case whenever possible
    Cc_ver!: string;
    Resistances!: DamageType[];
    Reactions!: string[]; // I haven't decided what I want to do with this yet. for now just names?
    Ejected!: boolean;
    MeltdownImminent!: boolean;
    Burn!: number;
    CoreActive!: boolean; // Are core bonuses currently in effect

    // These are posessed systems/weapons/etc of the frame that are not necessarily equipped.
    // Good for if your players like to reflavor their items.
    // Everything in MechLoadout should just be reffing to these items (avoid making duplicates - an easy mistake to make but one that will ultimately become very annoying)

    private _owned_weapons!: MechWeapon[];
    public get OwnedWeapons(): MechWeapon[] {
        return [...this._owned_weapons];
    }

    private _owned_systems!: MechSystem[];
    public get OwnedSystems(): MechSystem[] {
        return this._owned_systems;
    }

    private _owned_weapon_mods!: WeaponMod[];
    public get OwnedWeaponMods(): WeaponMod[] {
        return this._owned_weapon_mods;
    }

    private _owned_frames!: Frame[];
    public get OwnedFrames(): Frame[] {
        return this._owned_frames;
    }

    private _statuses_and_conditions!: Status[];
    public get StatusesAndConditions(): Status[] {
        return [...this._statuses_and_conditions];
    }

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

    public get Frame(): Frame | null {
        return this.Loadout.Frame;
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
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("size");
        const size = Math.ceil(this.Frame.Stats.size + bonus);
        return bound_int(size, 0.5, Rules.MaxFrameSize);
    }

    public get Armor(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("armor");
        const armor = this.Frame.Stats.armor + bonus;
        return bound_int(armor, 0, Rules.MaxMechArmor);
    }

    public get SaveTarget(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("save");
        return this.Frame.Stats.save + bonus;
    }

    public get Evasion(): number {
        if (!this.Frame) return 0;
        // if (this.IsStunned) return 5;
        // TODO - allow status bonuses to override somehow
        const bonus = this.sum_bonuses("evasion");
        return this.Frame.Stats.evasion + bonus;
    }

    public get Speed(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("speed");
        return this.Frame.Stats.speed + bonus;
    }

    public get SensorRange(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("sensor");
        return this.Frame.Stats.sensor_range + bonus;
    }

    public get EDefense(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("edef");
        return this.Frame.Stats.edef + bonus;
    }

    public get LimitedBonus(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("limited_bonus");
        return bonus;
    }

    public get AttackBonus(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("attack");
        return bonus;
    }

    public get TechAttack(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("tech_attack");
        return this.Frame.Stats.tech_attack + bonus;
    }

    public get Grapple(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("grapple");
        return Rules.BaseGrapple + bonus;
    }

    public get Ram(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("ram");
        return Rules.BaseRam + bonus;
    }

    public get SaveBonus(): number {
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("save");
        return bonus;
    }

    // -- HASE --------------------------------------------------------------------------------------
    public get Hull(): number {
        return this.Pilot?.MechSkills.Hull || 0;
    }

    public get Agi(): number {
        return this.Pilot?.MechSkills.Agi || 0;
    }

    public get Sys(): number {
        return this.Pilot?.MechSkills.Sys || 0;
    }

    public get Eng(): number {
        return this.Pilot?.MechSkills.Eng || 0;
    }

    // -- Stats -------------------------------------------------------------------------------------

    public get MaxStructure(): number {
        if (!this.Frame) return 0;
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
        if (!this.Frame) return 0;
        const bonus = this.sum_bonuses("hp");
        return this.Frame.Stats.hp + bonus;
    }

    public get CurrentSP(): number {
        if (!this.Frame) return 0;
        return this.Loadout.TotalSP;
    }

    public get MaxSP(): number {
        if (!this.Frame) return 0;
        return this.Frame.Stats.sp + this.sum_bonuses("sp");
    }

    public get FreeSP(): number {
        if (!this.Frame) return 0;
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
        if (!this.Frame) return false;
        return this.CurrentHeat >= Math.ceil(this.HeatCapacity / 2);
    }

    public get HeatCapacity(): number {
        if (!this.Frame) return 0;
        return this.Frame.Stats.heatcap + this.sum_bonuses("heatcap");
    }

    public get MaxStress(): number {
        if (!this.Frame) return 0;
        return this.Frame.Stats.stress + this.sum_bonuses("stress");
    }

    public get RepairCapacity(): number {
        if (!this.Frame) return 0;
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
        this.CurrentMove = this.Speed;
    }

    // -- Statuses and Conditions -------------------------------------------------------------------
    public get StatusString(): string[] {
        const out: string[] = [];
        if (this.Frame) return ["No frame equipped"];
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
    public repair_destroyed(): void {
        this.MeltdownImminent = false;
        this.clear_statuses();
        this.CurrentStress = 1;
        this.CurrentStructure = 1;
        this.CurrentHP = this.MaxHP;
    }

    // Just deletes all status items
    public clear_statuses(): void {
        let tmp = this.StatusesAndConditions;
        this._statuses_and_conditions = [];
        for (let s of tmp) {
            s.destroy_entry();
        }
    }

    // -- Active Mode Utilities ---------------------------------------------------------------------
    public full_repair(): void {
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
        this.clear_statuses();
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
        if (!this.Frame) return [];
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
    public save(): RegMechData {
        return {
            id: this.ID,
            pilot: this.Pilot?.as_ref() ?? null,
            name: this.Name,
            notes: this.Notes,
            gm_note: this.GmNote,
            portrait: this.Portrait,
            cloud_portrait: this.CloudPortrait,
            current_structure: this.CurrentStructure,
            current_hp: this.CurrentHP,
            overshield: this.Overshield,
            current_stress: this.CurrentStress,
            current_heat: this.CurrentHeat,
            current_repairs: this.CurrentRepairs,
            current_overcharge: this.CurrentOvercharge,
            current_core_energy: this.CurrentCoreEnergy,
            core_active: this.CoreActive,
            resistances: this.Resistances,
            reactions: this.Reactions,
            burn: this.Burn,
            ejected: this.Ejected,
            activations: this.Activations,
            meltdown_imminent: this.MeltdownImminent,
            cc_ver: CC_VERSION,
            loadout: this.Loadout.save(),
        };
    }

    public async load(data: RegMechData): Promise<void> {
        data = {...defaults.MECH(), ...data};
        let subreg = this.get_inventory();
        this.ID = data.id;
        this.Pilot = data.pilot ? await subreg.resolve(this.OpCtx, data.pilot) : null;
        this.Name = data.name;
        this.Notes = data.notes;
        this.GmNote = data.gm_note;
        this.Portrait = data.portrait;
        this.CloudPortrait = data.cloud_portrait;
        this.Loadout = await new MechLoadout(subreg, this.OpCtx, data.loadout).ready();
        this.CurrentStructure = data.current_structure;
        this.CurrentHP = data.current_hp;
        this.Overshield = data.overshield || 0;
        this.CurrentStress = data.current_stress;
        this.CurrentHeat = data.current_heat;
        this.CurrentRepairs = data.current_repairs;
        this.CurrentOvercharge = data.current_overcharge || 0;
        this.CurrentCoreEnergy = data.current_core_energy ?? 1;
        this.Resistances = data.resistances || [];
        this.Reactions = data.reactions || [];
        this.Burn = data.burn || 0;
        this.Ejected = data.ejected || false;
        this.Activations = data.activations || 1;
        this.MeltdownImminent = data.meltdown_imminent || false;
        this.CoreActive = data.core_active || false;

        // Get our owned stuff. In order to equip something one must drag it from the pilot to the mech and then equip it there.
        // They will be two separate items. This is a bit odd, but for the most part the pilot-items are more of a "shop" for the mechs to insinuate from.
        this._owned_frames = await subreg.get_cat(EntryType.FRAME).list_live(this.OpCtx);
        this._owned_systems = await subreg.get_cat(EntryType.MECH_SYSTEM).list_live(this.OpCtx);
        this._owned_weapons = await subreg.get_cat(EntryType.MECH_WEAPON).list_live(this.OpCtx);
        this._owned_weapon_mods = await subreg.get_cat(EntryType.WEAPON_MOD).list_live(this.OpCtx);
        this._statuses_and_conditions = await subreg
            .get_cat(EntryType.STATUS)
            .list_live(this.OpCtx);
    }

    // All bonuses affecting this mech, from itself, its pilot, and (todo) any status effects
    public get AllBonuses(): Bonus[] {
        if (this.Pilot) {
            return [...this.Pilot.PilotBonuses, ...this.MechBonuses];
        } else {
            return this.MechBonuses;
        }
    }

    // Sum our pilot bonuses and our intrinsic bonuses for one big honkin bonus for the specified id, return the number
    private sum_bonuses(id: string): number {
        return Bonus.SumPilotBonuses(this.Pilot, this.AllBonuses, id);
    }

    public get_child_entries(): RegEntry<any>[] {
        return [
            ...this.OwnedSystems,
            ...this.OwnedWeapons,
            ...this.OwnedWeaponMods,
            ...this.OwnedFrames,
            ...this.StatusesAndConditions,
        ];
    }
}

export async function mech_cloud_sync(
    data: PackedMechData,
    mech: Mech,
    compendium_reg: Registry
): Promise<void> {
    // Reg stuff
    let mech_inv = mech.get_inventory();
    let ctx = mech.OpCtx;
    let covetous: CovetousReg;
    if (mech.Pilot) {
        covetous = new CovetousReg(mech_inv, [mech.Pilot.get_inventory(), compendium_reg]);
    } else {
        covetous = new CovetousReg(mech_inv, [compendium_reg]);
    }

    // All of this is trivial
    mech.ID = data.id;
    mech.Name = data.name;
    mech.Notes = data.notes;
    mech.GmNote = data.gm_note;
    mech.Portrait = data.portrait;
    mech.CloudPortrait = data.cloud_portrait;
    mech.CurrentStructure = data.current_structure;
    mech.CurrentStress = data.current_stress;
    mech.CurrentHP = data.current_hp;
    mech.Overshield = data.overshield;
    mech.CurrentHeat = data.current_heat;
    mech.CurrentRepairs = data.current_repairs;
    mech.CurrentOvercharge = data.current_overcharge;
    mech.CurrentCoreEnergy = data.current_core_energy;
    mech.Burn = data.burn;
    mech.Ejected = data.ejected;
    mech.Activations = data.activations;
    mech.MeltdownImminent = data.meltdown_imminent;
    mech.Cc_ver = data.cc_ver;
    mech.CoreActive = data.core_active;
    mech.Resistances = data.resistances as DamageType[];
    mech.Reactions = data.reactions;

    // We only take one loadout - whichever is active
    let packed_loadout = data.loadouts[data.active_loadout_index];

    // The unpacking process does basically everything we need, including insinuation (thank you covetous ref!)
    await mech.Loadout.sync(data.frame, packed_loadout, covetous);
    // Resolve the frame and set it
    // mech.Loadout.unpack(packed_loadout,

    // Finally, statuses are _kind of_ simple. Yeet the old ones (TODO: We want to only destroy effects thaat compcon produces, so as not to destroy custom active effects)
    for (let s of mech.StatusesAndConditions) {
        await s.destroy_entry();
    }
    let snc_names = [...data.statuses, ...data.conditions];

    // And re-resolve
    await covetous.resolve_many(
        ctx,
        snc_names.map(n => quick_mm_ref(EntryType.STATUS, n))
    );

    // We always want to insinuate and writeback to be sure we own all of these items
    await mech.writeback();
}
