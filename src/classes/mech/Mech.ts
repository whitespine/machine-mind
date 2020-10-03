import uuid from "uuid/v4";
import _ from "lodash";
import {
    Rules,
    Pilot,
    Frame,
    MechLoadout,
    MechSystem,
    IntegratedMount,
    CoreBonus,
    ActiveState,
} from "@/class";
import { imageManagement, ImageTag, logger } from "@/hooks";
import { store } from "@/hooks";
import { VActor, IMechLoadoutData } from "@/interface";
import { LicensedRequirementBuilder, ILicenseRequirement } from "../LicensedItem";
import { ident, MixBuilder, RWMix, MixLinks, ser_one } from '@/mixmeta';
import { CreateFrame } from './Frame';

export interface IMechData {
    id: string;
    name: string;
    notes: string;
    gm_note: string;
    portrait: string;
    cloud_portrait: string;
    frame: string;
    active: boolean;
    current_structure: number;
    current_hp: number;
    overshield: number;
    current_stress: number;
    current_heat: number;
    current_repairs: number;
    current_overcharge: number;
    current_core_energy: number;
    loadouts: IMechLoadoutData[];
    active_loadout_index: number;
    statuses: string[];
    conditions: string[];
    resistances: string[];
    reactions: string[];
    burn: number;
    ejected: boolean;
    destroyed: boolean;
    defeat: string;
    activations: number;
    meltdown_imminent: boolean;
    reactor_destroyed: boolean;
    cc_ver: string;
}

export interface Mech implements VActor extends MixLinks<IMechData> {
     Id: string;
     Name: string;
     Notes: string;
     GmNote: string;
     Portrait: string;
     CloudPortrait: string;
     Frame: Frame;
     Loadouts: MechLoadout[];
     ActiveLoadout: MechLoadout | null | undefined;
     CurrentStructure: number;
     CurrentHP: number;
     Overshield: number;
     CurrentStress: number;
     CurrentHeat: number;
     CurrentRepairs: number;
     CurrentCorePower: number;
     CurrentOvercharge: number; // as a number of uses so far
     Activations: number;
     Active: boolean;
     Pilot: Pilot;
     Cc_ver: string;
     Statuses: string[];
     Conditions: string[];
     Resistances: string[];
     Reactions: string[];
     Ejected: boolean;
     Destroyed: boolean;
     Defeat: string;
     ReactorDestroyed: boolean;
     MeltdownImminent: boolean;
     Burn: number;

     // Per-turn tracking
     // Actions: number;
     CurrentMove: number;

     // Functions
}


function CreateMech(data: IMechData): Mech {
    let mb = new MixBuilder<Mech, IMechData>({});
     mb.with(new RWMix("Id", "id", ident, ident);
     mb.with(new RWMix("Name","name", ident, ident);
     mb.with(new RWMix("Notes","notes", ident, ident);
     mb.with(new RWMix("GmNote","gm_note", ident, ident);
     mb.with(new RWMix("Portrait","portrait" , ident, ident);
     mb.with(new RWMix("CloudPortrait","cloud_portrait" , ident, ident);
     mb.with(new RWMix("Frame","frame", CreateFrame, ser_one);
     mb.with(new RWMix("Loadouts","loadouts" MechLoadout[];
     mb.with(new RWMix("ActiveLoadout","current_structure" MechLoadout | null | undefined;
     mb.with(new RWMix("CurrentStructure","current_hp" number;
     mb.with(new RWMix("CurrentHP","overshield" number;
     mb.with(new RWMix("Overshield","current_stress" number;
     mb.with(new RWMix("CurrentStress","current_heat" number;
     mb.with(new RWMix("CurrentHeat","current_repairs" number;
     mb.with(new RWMix("CurrentRepairs","current_overcharge" number;
     mb.with(new RWMix("CurrentCorePower","current_core_energy" number;
     mb.with(new RWMix("CurrentOvercharge","loadouts" number; // as a number of uses so far
     mb.with(new RWMix("Activations","active_loadout_index" number;
     mb.with(new RWMix("Active","statuses" boolean;
     mb.with(new RWMix("Pilot","conditions" Pilot;
     mb.with(new RWMix("Cc_ver","resistances" , ident, ident);
     mb.with(new RWMix("Statuses","reactions" string[];
     mb.with(new RWMix("Conditions","burn" string[];
     mb.with(new RWMix("Resistances","ejected" string[];
     mb.with(new RWMix("Reactions","destroyed" string[];
     mb.with(new RWMix("Ejected","defeat" boolean;
     mb.with(new RWMix("Destroyed","activations" boolean;
     mb.with(new RWMix("Defeat","meltdown_imminent" , ident, ident);
     mb.with(new RWMix("ReactorDestroyed","reactor_destroyed" boolean;
     mb.with(new RWMix("Meltdown_imminent","cc_ver" boolean;
     mb.with(new RWMix("Burn", "burn";
     mb.with(new RWMix("Actions", "actions";
     mb.with(new RWMix("CurrentMove", number;
}

    // -- Utility -----------------------------------------------------------------------------------

    // -- Info --------------------------------------------------------------------------------------
    function getEncounterName(this: Mech): string {
        return this.Pilot.Callsign;
    }


    function getsCascading(this: Mech): boolean {
        if (!this.ActiveLoadout || !this.ActiveLoadout.AICount) return false;
        return this.ActiveLoadout.Equipment.some(x => x.IsCascading);
    }

    // Get the license list, and whether they are satisfied
    function getRequiredLicenseList(this: Mech): ILicenseRequirement[] {
        return this.RequiredLicenses().check_satisfied(this.Pilot);
    }

    function RequiredLicenses(this: Mech): LicensedRequirementBuilder {
        // Get the requirements
        let requirements: LicensedRequirementBuilder;
        if (this.ActiveLoadout) {
            requirements = this.ActiveLoadout.RequiredLicenses();
        } else {
            requirements = new LicensedRequirementBuilder();
        }

        // Add the frame
        return requirements.add_item(this.Frame);
    }

    // -- Attributes --------------------------------------------------------------------------------
    function getize(this: Mech): number {
    }

    // function getizeIcon(this: Mech): string {
        // return `cci-size-${this.Size === 0.5 ? "half" : this.Size}`;
    // }

    function getizeContributors(this: Mech): string[] {
        const output = [`FRAME Base Size: ${this.Frame.Size}`];
        if (this.HasFomorian) output.push(`FOMORIAN FRAME (IPS-N CORE Bonus): +1`);
        return output;
    }

    function getrmor(this: Mech): number {
        // Decide if core bonuses apply
        const bonus = this.HasSlopedPlating && this._frame.Armor < Rules.MaxMechArmor;
        return this._frame.Armor + (bonus ? 1 : 0);
    }

    function getrmorContributors(this: Mech): string[] {
        const output = [`FRAME Base Armor: ${this.Frame.Armor}`];
        if (this.HasSlopedPlating) output.push(`SLOPED PLATING (IPS-N CORE Bonus): +1`);
        return output;
    }

    function getaveTarget(this: Mech): number {
        let bonus = this._pilot.Grit;
        if (this.HasLessonOfTheOpenDoor) bonus += 2;
        return this._frame.SaveTarget bonus;
    }

    function getaveTargetContributors(this: Mech): string[] {
        const output = [
            `FRAME Base Save Target: ${this.Frame.SaveTarget}`,
            `Pilot GRIT Bonus: +${this._pilot.Grit}`,
        ];
        if (this.HasLessonOfTheOpenDoor)
            output.push(`THE LESSON OF THE OPEN DOOR (HORUS CORE Bonus): +2`);
        return output;
    }

    function getvasion(this: Mech): number {
        let bonus = this.Agi;
        if (this.HasFullSubjectivitySync) {
            bonus += 2;
        }
        return this._frame.Evasion + bonus;
    }

    function getvasionContributors(this: Mech): string[] {
        const output = [
            `FRAME Base Evasion: ${this.Frame.Evasion}`,
            `Pilot AGILITY Bonus: +${this.Agi}`,
        ];
        if (this.HasFullSubjectivitySync)
            output.push(`FULL SUBJECTIVITY SYNC (SSC CORE Bonus): +2`);
        return output;
    }

    function getpeed(this: Mech): number {
        const bonus = Math.floor(this.Agi / 2);
        return this._frame.Speed + bonus;
    }

    function getpeedContributors(this: Mech): string[] {
        return [
            `FRAME Base Speed: ${this.Frame.Speed}`,
            `Pilot AGILITY Bonus: +${Math.floor(this.Agi / 2)}`,
        ];
    }

    function getensorRange(this: Mech): number {
        return this._frame.SensorRange;
    }

    function getensorRangeContributors(this: Mech): string[] {
        return [`FRAME Base Sensor Range: ${this.Frame.SensorRange}`];
    }

    function getDefense(this: Mech): number {
        let bonus = this.Sys;
        if (this.HasLessonOfDisbelief) bonus += 2;
        return this._frame.EDefense + bonus;
    }

    function getDefenseContributors(this: Mech): string[] {
        const output = [
            `FRAME Base E-Defense: ${this.Frame.EDefense}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
        ];
        if (this.HasLessonOfDisbelief)
            output.push(`THE LESSON OF DISBELIEF (HORUS CORE Bonus): +2`);
        return output;
    }

    function getimitedBonus(this: Mech): number {
        let bonus = 0;
        if (this.HasIntegratedAmmoFeeds) bonus += 2;
        return Math.floor(this.Eng / 2) + bonus;
    }

    function getimitedContributors(this: Mech): string[] {
        const output = [`Pilot ENGINEERING Bonus: +${Math.floor(this.Eng / 2)}`];
        if (this.HasIntegratedAmmoFeeds) output.push(`INTEGRATED AMMO FEEDS (HA CORE Bonus): +2`);
        return output;
    }

    function getttackBonus(this: Mech): number {
        return this._pilot.Grit;
    }

    function getttackBonusContributors(this: Mech): string[] {
        return [`Pilot GRIT Bonus: ${this._pilot.Grit}`];
    }

    function getechAttack(this: Mech): number {
        const bonus = this.Sys;
        return this._frame.TechAttack + bonus;
    }

    function getechAttackContributors(this: Mech): string[] {
        return [
            `FRAME Base Tech Attack: ${this.Frame.TechAttack}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
        ];
    }

    function getrapple(this: Mech): number {
        return Rules.BaseGrapple;
    }

    function getam(this: Mech): number {
        return Rules.BaseRam;
    }

    function getaveBonus(this: Mech): number {
        return this._pilot.Grit;
    }

    function getaveBonusContributors(this: Mech): string[] {
        return [`Pilot GRIT Bonus: ${this._pilot.Grit}`];
    }

    // -- HASE --------------------------------------------------------------------------------------
    function getull(this: Mech): number {
        return this._pilot.MechSkills.Hull;
    }

    function getgi(this: Mech): number {
        return this._pilot.MechSkills.Agi;
    }

    function getys(this: Mech): number {
        return this._pilot.MechSkills.Sys;
    }

    function getng(this: Mech): number {
        return this._pilot.MechSkills.Eng;
    }

    // -- Stats -------------------------------------------------------------------------------------


    function getaxStructure(this: Mech): number {
        return this._frame.Structure;
    }

    function gettructureContributors(this: Mech): string[] {
        return [`FRAME Base Structure: ${this.Frame.Structure}`];
    }


    function ApplyDamage(dmg: number, resistance?: string | null): void {
        if (resistance && this._resistances.includes(resistance)) {
            dmg = Math.ceil(dmg / 2);
        }
        this.CurrentHP -= dmg;
    }

    function getMaxHP(this: Mech): number {
        let bonus = this._pilot.Grit + this.Hull * 2;
        if (this.ActiveLoadout) {
            const personalizations = this.ActiveLoadout.GetSystem("ms_personalizations");
            if (personalizations && !personalizations.Destroyed) bonus += 2;
        }
        if (this.HasReinforcedFrame) bonus += 5;
        return this._frame.HP + bonus;
    }

    function getHPContributors(this: Mech): string[] {
        const output = [
            `FRAME Base HP: ${this.Frame.HP}`,
            `Pilot GRIT Bonus: +${this._pilot.Grit}`,
            `Pilot HULL Bonus: +${this.Hull * 2}`,
        ];
        if (this.ActiveLoadout && this.ActiveLoadout.HasSystem("ms_personalizations"))
            output.push(`PERSONALIZATIONS (GMS System): +2`);
        if (this.HasReinforcedFrame) output.push(`REINFORCED FRAME (IPS-N CORE Bonus): +5`);
        return output;
    }

    function getCurrentSP(this: Mech): number {
        if (!this.ActiveLoadout) return this.MaxSP;
        return this.ActiveLoadout.TotalSP;
    }

    function getMaxSP(this: Mech): number {
        const bonus = this._pilot.Grit + Math.floor(this.Sys / 2);
        return this.Frame.SP + bonus;
    }

    function getFreeSP(this: Mech): number {
        return this.MaxSP - this.CurrentSP;
    }

    function getSPContributors(this: Mech): string[] {
        return [
            `FRAME Base SP: ${this.Frame.SP}`,
            `Pilot GRIT Bonus: +${this._pilot.Grit}`,
            `Pilot SYSTEMS Bonus: +${Math.floor(this.Sys / 2)}`,
        ];
    }

    function AddHeat(this: Mech, heat: number): number { // The returned value is the # of stresses this causes
        heat = this._resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        let newHeat = this._current_heat + heat;
        let count = 0;
        while (newHeat > this.HeatCapacity) {
            this.CurrentStress -= 1;
            newHeat -= this.HeatCapacity;
            count++;
        }
        this.CurrentHeat = newHeat;
        return count;
    }

    function ReduceHeat(heat: number, resist?: boolean | null): void {
        if (resist) heat = this._resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        while (heat > this.CurrentHeat) {
            heat -= this.CurrentHeat;
            this.CurrentStress += 1;
            this._current_heat = this.HeatCapacity;
        }
        this.CurrentHeat -= heat;
    }

    function getsInDangerZone(this: Mech): boolean {
        return this.IsActive && this._current_heat >= Math.ceil(this.HeatCapacity / 2);
    }

    function geteatCapacity(this: Mech): number {
        let bonus = this.Eng;
        if (this.HasSuperiorByDesign) bonus += 2;
        return this._frame.HeatCap + bonus;
    }

    function geteatCapContributors(this: Mech): string[] {
        const output = [
            `FRAME Base Heat Capacity: ${this.Frame.HeatCap}`,
            `Pilot ENGINEERING Bonus: +${this.Eng}`,
        ];
        if (this.HasSuperiorByDesign) output.push(`SUPERIOR BY DESIGN (HA CORE Bonus): +2`);
        return output;
    }

    function geturrentStress(this: Mech): number {
        return this._current_stress;
    }

    function set CurrentStress(stress: number) {
        if (stress > this.MaxStress) this._current_stress = this.MaxStress;
        else if (stress < 0) this._current_stress = 0;
        else this._current_stress = stress;
        this.save();
    }

    function getaxStress(this: Mech): number {
        return this._frame.HeatStress;
    }

    function gettressContributors(this: Mech): string[] {
        return [`FRAME Base Reactor Stress: ${this.Frame.HeatStress}`];
    }

    function geturrentRepairs(this: Mech): number {
        return this._current_repairs;
    }

    function set CurrentRepairs(rep: number) {
        if (rep > this.RepairCapacity) this._current_repairs = this.RepairCapacity;
        else if (rep < 0) this._current_repairs = 0;
        else this._current_repairs = rep;
        this.save();
    }

    function getepairCapacity(this: Mech): number {
        const bonus = Math.floor(this.Hull / 2);
        return this._frame.RepCap + bonus;
    }

    function getepCapContributors(this: Mech): string[] {
        return [
            `FRAME Base Repair Capacity: ${this.Frame.RepCap}`,
            `Pilot HULL Bonus: +${Math.floor(this.Hull / 2)}`,
        ];
    }



    // -- Encounter Management ----------------------------------------------------------------------
    function AddReaction(this: Mech, r: string): void {
        if (!this.Reactions.some(x => x === r)) this.Reactions.push(r);
    }

    function RemoveReaction(this: Mech,r: string): void {
        const idx = this.Reactions.findIndex(x => x === r);
        if (idx > -1) this.Reactions.splice(idx, 1);
    }

    function NewTurn(this: Mech): void {
        this.Activations = 1;
        // this.Actions = 2;
        this.CurrentMove = this.MaxMove();
    }

    // -- Statuses and Conditions -------------------------------------------------------------------
    function getStatusString(this: Mech): string[] {
        const out: string[] = [];
        if (this.ReactorDestroyed) out.push("reactorDestroyed");
        if (this.Destroyed) out.push("destroyed");
        if (this.Ejected) out.push("ejected");
        if (this.MeltdownImminent) out.push("meltdown");
        if (this.ActiveLoadout?.Systems.filter(x => x.IsCascading).length) out.push("cascading");
        if (this.FreeSP() < 0) out.push("overSP");
        if (this.FreeSP()> 0) out.push("underSP");
        if (this.ActiveLoadout?.HasEmptyMounts) out.push("unfinished");
        if (this.RequiredLicenseList().filter(x => x.missing).length) out.push("unlicensed");
        return out;
    }

    function Destroy(this: Mech): void {
        this._destroyed = true;
        this._defeat = "Destroyed";
    }

    function Repair(this: Mech): void {
        this._destroyed = false;
        this._reactor_destroyed = false;
        this._meltdown_imminent = false;
        this._statuses = [];
        this._conditions = [];
        this.CurrentStress = 1;
        this.CurrentStructure = 1;
        this.CurrentHP = this.MaxHP;
        this.save();
    }


    // -- Active Mode Utilities ---------------------------------------------------------------------
    function full_repair(this: Mech): void {
        this.CurrentStructure = this.MaxStructure();
        this.CurrentHP = this.MaxHP();
        this.CurrentStress = this.MaxStress();
        this.CurrentHeat = 0;
        this.CurrentRepairs = this.RepairCapacity();
        this.CurrentCorePower = 1;
        this.CurrentOvercharge = 0;
        this._loadouts.forEach(x => {
            x.Equipment.forEach(y => {
                if (y.Destroyed) y.Repair();
                if (y.IsLimited) y.Uses = y.getTotalUses(this.Pilot.LimitedBonus);
            });
        });
        this._statuses = [];
        this._conditions = [];
        this._resistances = [];
        this.Burn = 0;
        this._destroyed = false;
        this._defeat = "";
        this._reactor_destroyed = false;
        this._meltdown_imminent = false;
        this.save();
    }

    // -- Integrated/Talents ------------------------------------------------------------------------
    function get_integrated_mounts(): IntegratedMount[] {
        /*
        const intg: IntegratedMount[] = [];
        if (this._frame.CoreSystem.getIntegrated()) {
            intg.push(new IntegratedMount(this._frame.CoreSystem.getIntegrated()!, "CORE System"));
        }

        let nuccav = store.compendium.getReferenceByID("Talents", "t_nuclear_cavalier");
        let nuc_rank = this._pilot.rank(nuccav);
        if (nuc_rank >= 3) {
            const frWeapon = store.compendium.getReferenceByID("MechWeapons", "mw_fuel_rod_gun");
            intg.push(new IntegratedMount(frWeapon, "Nuclear Cavalier"));
        }

        let engineer = store.compendium.getReferenceByID("Talents", "t_engineer");
        let eng_rank = this._pilot.rank(engineer);
        if (eng_rank) {
            const id = `mw_prototype_${eng_rank}`;
            const engWeapon = store.compendium.getReferenceByID("MechWeapons", id);
            intg.push(new IntegratedMount(engWeapon, "Engineer"));
        }
        return intg;
        */
    }

    function get_integrated_systems(): MechSystem[] {
        const intg: MechSystem[] = [];

        let armory = store.compendium.getReferenceByID("Talents", "t_walking_armory");
        let arm_rank = this._pilot.rank(armory);
        if (arm_rank) {
            const arms = store.compendium.instantiate(
                "MechSystems",
                `ms_walking_armory_${arm_rank}`
            );
            intg.push(arms);
        }

        let technophile = store.compendium.getReferenceByID("Talents", "t_technophile");
        let techno_rank = this._pilot.rank(armory);
        if (techno_rank) {
            const techno = store.compendium.instantiate(
                "MechSystems",
                `ms_technophile_${techno_rank}`
            );
            intg.push(techno);
        }
        return intg;
    }

    // -- Loadouts ----------------------------------------------------------------------------------
    function RemoveLoadout(): void {
        if (this._loadouts.length === 1) {
            console.error(`Cannot remove last Mech Loadout`);
        } else {
            const index = this._loadouts.findIndex(x => x.ID === this.ActiveLoadout?.ID);
            this._active_loadout = this._loadouts[index + (index === 0 ? 1 : -1)];
            this._loadouts.splice(index, 1);
            this.save();
        }
    }

    function CloneLoadout(): void {
        const index = this._loadouts.findIndex(x => x.ID === this.ActiveLoadout?.ID);
        if (index > -1) {
            const newLoadout = MechLoadout.Deserialize(
                MechLoadout.Serialize(this.ActiveLoadout!),
                this
            );
            newLoadout.RenewID();
            newLoadout.Name += " (Copy)";
            this._loadouts.splice(index + 1, 0, newLoadout);
            this._active_loadout = this._loadouts[index + 1];
            this.save();
        } else {
            logger("Could not clone - no active loadout");
        }
    }

    function UpdateLoadouts(): void {
        this._loadouts.forEach(x => {
            x.UpdateIntegrated(this);
        });
    }

    // -- Mountable CORE Bonuses --------------------------------------------------------------------
    function get_pilot_bonuses(): CoreBonus[] {
        return this.Pilot.CoreBonuses.filter(x => x.IsMountable);
    }

    function get_applied_bonuses(): CoreBonus[] {
        return _.flatten(
            this.ActiveLoadout?.AllEquippableMounts(true, true).map(x => x.Bonuses) || []
        );
    }

    function get_available_bonuses(): CoreBonus[] {
        return this.PilotBonuses.filter(x => !this.AppliedBonuses.includes(x));
    }

    // -- I/O ---------------------------------------------------------------------------------------