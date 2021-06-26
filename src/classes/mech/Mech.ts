import {
    Action,
    Bonus,
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
    WeaponMod,
} from "@src/class";
import { bound_int, defaults } from "@src/funcs";
import {
    BonusContext,
    DamageTypeChecklist,
    PackedMechLoadoutData,
    RegMechLoadoutData,
    SourcedCounter,
} from "@src/interface";
import { EntryType, InventoriedRegEntry, RegEntry, Registry, RegRef } from "@src/registry";
import { DamageType } from "@src/enums";
import { fallback_obtain_ref, RegFallback } from "../regstack";
import { merge_defaults } from "../default_entries";
import { AllPilotSyncHooks } from "../GeneralInterfaces";
import { CC_VERSION } from "@src/consts";
// import { RegStack } from '../regstack';

interface AllMechData {
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
    meltdown_imminent: boolean; // TODO: Make this active effect
    cc_ver: string;
    core_active: boolean;
}

export interface PackedMechData extends AllMechData {
    id: string;
    active: boolean;
    frame: string;
    statuses: string[];
    conditions: string[];
    resistances: string[];
    reactions: string[];
    loadouts: PackedMechLoadoutData[];
    active_loadout_index: number;
    activations: number; // We don't track this or other current-state things quite yet

    // These are easily deduced and thus not kept
    reactor_destroyed: boolean;
    destroyed: boolean;
    defeat: string;
}

export interface RegMechData extends AllMechData {
    lid: string;
    pilot: RegRef<EntryType.PILOT> | null;
    resistances: DamageTypeChecklist;
    //reactions: RegRef<EntryType.ACTION>[]
    reactions: string[];
    loadout: RegMechLoadoutData; // We only support one, for now
}

export class Mech extends InventoriedRegEntry<EntryType.MECH> {
    LID!: string;
    Name!: string;
    Notes!: string;
    GmNote!: string;
    Portrait!: string;
    CloudPortrait!: string;
    Loadout!: MechLoadout;
    CurrentStructure!: number; // Get set elsewhere to bound
    CurrentStress!: number;
    Overshield!: number;
    CurrentHeat!: number;
    CurrentHP!: number;
    CurrentRepairs!: number;
    CurrentCoreEnergy!: number;
    CurrentOvercharge!: number;
    // Activations!: number;
    Pilot!: Pilot | null; // We want to avoid the null case whenever possible
    Cc_ver!: string;
    Resistances!: DamageTypeChecklist;
    Reactions!: string[]; // I haven't decided what I want to do with this yet. for now just names?
    Ejected!: boolean;
    MeltdownImminent!: boolean;
    Burn!: number;
    CoreActive!: boolean; // Are core bonuses currently in effect

    // -- Owned item helpers. Populated at time of load --------------------------------------------------------------------------------------
    private _statuses_and_conditions!: Status[];
    public get StatusesAndConditions(): Status[] {
        return [...this._statuses_and_conditions];
    }

    private _owned_mech_weapons!: MechWeapon[];
    public get OwnedMechWeapons(): MechWeapon[] {
        return [...this._owned_mech_weapons];
    }

    private _owned_mech_systems!: MechSystem[];
    public get OwnedSystems(): MechSystem[] {
        return this._owned_mech_systems;
    }

    private _owned_weapon_mods!: WeaponMod[];
    public get OwnedWeaponMods(): WeaponMod[] {
        return this._owned_weapon_mods;
    }

    private _owned_frames!: Frame[];
    public get OwnedFrames(): Frame[] {
        return this._owned_frames;
    }

    protected enumerate_owned_items(): RegEntry<EntryType>[] {
        return [
            ...this._owned_mech_weapons,
            ...this._owned_mech_systems,
            ...this._owned_weapon_mods,
            ...this._owned_frames,
            ...this._statuses_and_conditions,
        ];
    }

    // Per turn data
    // TurnActions!: number;
    // CurrentMove!: number;

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

    // -- Attributes --------------------------------------------------------------------------------
    public get SizeIcon(): string {
        return `cci-size-${this.Size === 0.5 ? "half" : this.Size}`;
    }

    public get Size(): number {
        if (!this.Frame) return 0;
        let bonus = this.sum_bonuses(this.Frame.Stats.size, "size");
        return bound_int(bonus, 0.5, Rules.MaxFrameSize);
    }

    public get Armor(): number {
        if (!this.Frame) return 0;
        let bonus = this.sum_bonuses(this.Frame.Stats.armor, "armor");
        return bound_int(bonus, 0, Rules.MaxMechArmor);
    }

    public get SaveTarget(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.save, "save");
    }

    public get Evasion(): number {
        if (!this.Frame) return 0;
        // if (this.IsStunned) return 5;
        // TODO - allow status bonuses to override somehow
        return this.sum_bonuses(this.Frame.Stats.evasion, "evasion");
    }

    public get Speed(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.speed, "speed");
    }

    public get SensorRange(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.sensor_range, "sensor");
    }

    public get EDefense(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.edef, "edef");
    }

    public get LimitedBonus(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(0, "limited_bonus");
    }

    public get AttackBonus(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(0, "attack");
    }

    public get TechAttack(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.tech_attack, "tech_attack");
    }

    public get Grapple(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(Rules.BaseGrapple, "grapple");
    }

    public get Ram(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(Rules.BaseRam, "ram");
    }

    public get SaveBonus(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(0, "save");
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
        return this.sum_bonuses(this.Frame.Stats.structure, "structure");
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
        return this.sum_bonuses(this.Frame.Stats.hp, "hp");
    }

    public get CurrentSP(): number {
        if (!this.Frame) return 0;
        return this.Loadout.TotalSP;
    }

    public get MaxSP(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.sp, "sp");
    }

    public get FreeSP(): number {
        if (!this.Frame) return 0;
        return this.MaxSP - this.CurrentSP;
    }

    public get IsInDangerZone(): boolean {
        if (!this.Frame) return false;
        return this.CurrentHeat >= Math.ceil(this.HeatCapacity / 2);
    }

    public get HeatCapacity(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.heatcap, "heatcap");
    }

    public get MaxStress(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.stress, "stress");
    }

    public get RepairCapacity(): number {
        if (!this.Frame) return 0;
        return this.sum_bonuses(this.Frame.Stats.repcap, "repcap");
    }

    public AddReaction(r: string): void {
        this.Reactions.push(r);
    }

    public RemoveReaction(r: string): void {
        const idx = this.Reactions.findIndex(x => x === r);
        if (idx > -1) this.Reactions.splice(idx, 1);
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
        data: {
            Bonuses?: Bonus[];
            Actions?: Action[];
            Synergies?: Synergy[];
            Deployables?: Deployable[];
            Counters?: Counter[];
        };
        source: Frame | MechSystem | MechWeapon | WeaponMod;
    }> {
        if (!this.Frame) return [];
        let output: Array<{
            data: {
                Bonuses?: Bonus[];
                Actions?: Action[];
                Synergies?: Synergy[];
                Deployables?: Deployable[];
                Counters?: Counter[];
            };
            source: Frame | MechSystem | MechWeapon | WeaponMod;
        }> = [];

        // Get from equipment
        for (let item of this.Loadout.Equipment) {
            if (include_destroyed || (!item.Destroyed && !item.Cascading)) {
                output.push({
                    data: item,
                    source: item,
                });
            }
        }

        // Get from frame traits
        output.push(
            ...this.Frame.Traits.map(t => ({
                data: t,
                source: this.Frame!,
            }))
        );

        // Get from core passive/active. Gotta do a remap
        if (this.Frame.CoreSystem) {
            output.push({
                data: {
                    Bonuses: this.Frame.CoreSystem.PassiveBonuses ?? [],
                    Actions: this.Frame.CoreSystem.PassiveActions ?? [],
                    Synergies: this.Frame.CoreSystem.PassiveSynergies ?? [],
                },
                source: this.Frame!,
            });

            if (this.CoreActive) {
                output.push({
                    data: {
                        Bonuses: this.Frame.CoreSystem.ActiveBonuses ?? [],
                        Actions: this.Frame.CoreSystem.ActiveActions ?? [],
                        Synergies: this.Frame.CoreSystem.ActiveSynergies ?? [],
                    },
                    source: this.Frame!,
                });
            }
        }

        return output;
    }

    private cached_bonuses: Bonus[] | null = null;
    public get MechBonuses(): Bonus[] {
        if (!this.cached_bonuses) {
            this.cached_bonuses = this.mech_feature_sources(false).flatMap(
                x => x.data.Bonuses ?? []
            );
        }
        return this.cached_bonuses;
    }

    // Force a recompute of bonuses. Only needed if items/loadout are modified
    public recompute_bonuses(include_pilot: boolean = true): void {
        this.cached_bonuses = null;
        if (this.Pilot && include_pilot) {
            this.Pilot.recompute_bonuses();
        }
    }

    // Re-populate all of our cached items
    public async repopulate_inventory(): Promise<void> {
        let _opt = { wait_ctx_ready: false };
        let subreg = await this.get_inventory();
        this._statuses_and_conditions = await subreg
            .get_cat(EntryType.STATUS)
            .list_live(this.OpCtx, _opt);
        this._owned_frames = await subreg.get_cat(EntryType.FRAME).list_live(this.OpCtx, _opt);
        this._owned_mech_systems = await subreg
            .get_cat(EntryType.MECH_SYSTEM)
            .list_live(this.OpCtx, _opt);
        this._owned_mech_weapons = await subreg
            .get_cat(EntryType.MECH_WEAPON)
            .list_live(this.OpCtx, _opt);
        this._owned_weapon_mods = await subreg
            .get_cat(EntryType.WEAPON_MOD)
            .list_live(this.OpCtx, _opt);
    }

    public MechSynergies(): Synergy[] {
        return this.mech_feature_sources(false).flatMap(x => x.data.Synergies ?? []);
    }

    public MechActions(): Action[] {
        return this.mech_feature_sources(false).flatMap(x => x.data.Actions ?? []);
    }

    public MechDeployables(): Deployable[] {
        return this.mech_feature_sources(true).flatMap(x => x.data.Deployables ?? []);
    }

    // Grabs counters from the pilot, their gear, their active mech, etc etc
    public MechCounters(): SourcedCounter<
        EntryType.MECH_WEAPON | EntryType.MECH_SYSTEM | EntryType.FRAME | EntryType.WEAPON_MOD
    >[] {
        let result: SourcedCounter<any>[] = [];
        for (let s_data of this.mech_feature_sources(true)) {
            let counters = s_data.data.Counters ?? [];
            result.push(...counters.map(c => c.mark_sourced(s_data.source)));
        }
        return result;
    }

    // -- I/O ---------------------------------------------------------------------------------------
    protected save_imp(): RegMechData {
        return {
            lid: this.LID,
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
            meltdown_imminent: this.MeltdownImminent,
            cc_ver: CC_VERSION,
            loadout: this.Loadout.save(),
        };
    }

    public async load(data: RegMechData): Promise<void> {
        merge_defaults(data, defaults.MECH());
        let subreg = await this.get_inventory();
        this.LID = data.lid;
        this.Pilot = data.pilot
            ? await subreg.resolve(this.OpCtx, data.pilot, { wait_ctx_ready: false })
            : null;
        this.Name = data.name;
        this.Notes = data.notes;
        this.GmNote = data.gm_note;
        this.Portrait = data.portrait;
        this.CloudPortrait = data.cloud_portrait;
        this.Loadout = new MechLoadout(subreg, this.OpCtx, data.loadout);
        await this.Loadout.load_done();
        this.CurrentStructure = data.current_structure;
        this.CurrentHP = data.current_hp;
        this.Overshield = data.overshield;
        this.CurrentStress = data.current_stress;
        this.CurrentHeat = data.current_heat;
        this.CurrentRepairs = data.current_repairs;
        this.CurrentOvercharge = data.current_overcharge;
        this.CurrentCoreEnergy = data.current_core_energy;
        this.Resistances = { ...data.resistances };
        this.Reactions = data.reactions;
        this.Burn = data.burn;
        this.Ejected = data.ejected || false;
        this.MeltdownImminent = data.meltdown_imminent;
        this.CoreActive = data.core_active;
        this.Cc_ver = data.cc_ver;
        await this.repopulate_inventory();
    }

    // All bonuses affecting this mech, from itself, its pilot, and (todo) any status effects
    public get AllBonuses(): Bonus[] {
        if (this.Pilot) {
            return [...this.Pilot.AllBonuses, ...this.MechBonuses];
        } else {
            return this.MechBonuses;
        }
    }

    // Sum our pilot bonuses and our intrinsic bonuses for one big honkin bonus for the specified id, return the number
    private sum_bonuses(base_value: number, id: string): number {
        let filtered = this.AllBonuses.filter(b => b.LID == id);
        let ctx: BonusContext = {};
        if (this.Pilot) {
            ctx = Bonus.ContextFor(this.Pilot);
        }
        return Bonus.Accumulate(base_value, filtered, ctx).final_value;
    }

    public async emit(): Promise<PackedMechData> {
        return {
            // activations: this.Activ
            activations: 1,
            active: false,
            active_loadout_index: 0,
            burn: this.Burn,
            cc_ver: this.Cc_ver,
            cloud_portrait: this.CloudPortrait,
            conditions: this.StatusesAndConditions.filter(sc => sc.Subtype == "Condition").map(
                c => c.Name
            ),
            statuses: this.StatusesAndConditions.filter(sc => sc.Subtype == "Status").map(
                s => s.Name
            ),
            core_active: this.CoreActive,
            current_core_energy: this.CurrentCoreEnergy,
            current_heat: this.CurrentHeat,
            current_hp: this.CurrentHP,
            current_overcharge: this.CurrentOvercharge,
            current_repairs: this.CurrentRepairs,
            current_stress: this.CurrentStress,
            current_structure: this.CurrentStructure,
            defeat: this.Destroyed
                ? "Destroyed"
                : this.ReactorDestroyed
                ? "Reactor Destroyed"
                : "Unknown",
            destroyed: this.Destroyed,
            ejected: this.Ejected,
            frame: this.Frame?.LID ?? "mf_everest",
            gm_note: this.GmNote,
            id: this.LID,
            loadouts: [await this.Loadout.emit()],
            meltdown_imminent: this.MeltdownImminent,
            name: this.Name,
            notes: this.Notes,
            overshield: this.Overshield,
            portrait: this.Portrait,
            reactions: this.Reactions,
            reactor_destroyed: this.ReactorDestroyed,
            resistances: Damage.FlattenChecklist(this.Resistances),
        };
    }
}

// Sync a mech. Subroutine of pilot sync
export async function mech_cloud_sync(
    data: PackedMechData,
    mech: Mech,
    fallback_source_regs: Registry[],
    sync_hooks: AllPilotSyncHooks,
    is_new: boolean = false // Is this a new mech? purely for  what to pass the sync_hook at the end
): Promise<void> {
    // Reg stuff
    let mech_inv = await mech.get_inventory();
    let ctx = mech.OpCtx;
    let stack: RegFallback;
    if (mech.Pilot) {
        stack = {
            base: mech_inv,
            fallbacks: [await mech.Pilot.get_inventory(), ...fallback_source_regs],
        };
    } else {
        stack = { base: mech_inv, fallbacks: [...fallback_source_regs] };
    }

    // All of this is trivial
    mech.LID = data.id;
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
    // mech.Activations = data.activations;
    mech.MeltdownImminent = data.meltdown_imminent;
    mech.Cc_ver = data.cc_ver;
    mech.CoreActive = data.core_active;
    mech.Resistances = Damage.MakeChecklist(data.resistances as DamageType[]);
    mech.Reactions = data.reactions;

    // We only take one loadout - whichever is active
    let packed_loadout = data.loadouts[data.active_loadout_index];

    // The loadout sync process does basically everything we need for items
    await mech.Loadout.sync(data, packed_loadout, stack, sync_hooks);
    if (sync_hooks.sync_loadout)
        await sync_hooks.sync_loadout(mech.Loadout, packed_loadout, is_new);

    // Finally, statuses are _kind of_ simple. Yeet the old ones (TODO: We want to only destroy effects that compcon produces, so as not to destroy custom active effects)
    for (let s of mech.StatusesAndConditions) {
        await s.destroy_entry();
    }
    let snc_names = [...data.statuses, ...data.conditions];

    // And re-resolve from compendium. Again, just want the fetch
    for (let snc of snc_names) {
        await fallback_obtain_ref(
            stack,
            ctx,
            {
                fallback_lid: snc,
                id: "",
                type: EntryType.STATUS,
            },
            sync_hooks
        );
    }

    // We always want to insinuate and writeback to be sure we own all of these items
    if (sync_hooks.sync_mech) await sync_hooks.sync_mech(mech, data, is_new);
    await mech.writeback();
}
