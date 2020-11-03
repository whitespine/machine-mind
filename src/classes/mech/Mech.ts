import { Bonus, CoreBonus, Damage, Frame, MechLoadout, Pilot, Rules, Status } from "@/class";
import { bound_int, contrib_helper } from "@/funcs";
import { IMechLoadoutData } from "@/interface";
import { EntryType, RegEntry, RegRef, SerUtil } from "@/registry";
import { DamageType } from "../enums";
import { ILicenseRequirement } from "../LicensedItem";

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
}

export interface PackedMechData extends AllMechData {
    frame: string;
    statuses: string[];
    conditions: string[];
    resistances: string[];
    reactions: string[];
    core_active: boolean;
    loadouts: IMechLoadoutData[];
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
    loadout: IMechLoadoutData; // We only support one, for now
}

export class Mech extends RegEntry<EntryType.MECH, RegMechData> {
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
    Reactions!: string[];
    Ejected!: boolean;
    MeltdownImminent!: boolean;
    Burn!: number;
    CoreActive!: boolean; // Are core bonuses currently in effect

    // Per turn data
    TurnActions!: number;
    CurrentMove!: number;

    // -- Info --------------------------------------------------------------------------------------
    public get EncounterName(): string {
        return this.Pilot.Callsign;
    }

    public get Icon(): string {
        return "cci-pilot";
    }

    public get IsCascading(): boolean {
        if (!this.Loadout.AICount) return false;
        return !!this.Loadout.Equipment.filter(x => x.Cascading).length;
    }

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

    // -- Attributes --------------------------------------------------------------------------------
    public get SizeIcon(): string {
        return `cci-size-${this.Stats.size === 0.5 ? "half" : this.Stats.size}`;
    }

    public get Size(): number {
        const bonus = Bonus.SumMechBonuses("size", this);
        const size = Math.ceil(this.Frame.Stats.size + bonus);
        return bound_int(size, 0.5, Rules.MaxFrameSize);
    }


    public get SizeContributors(): string[] {
        return contrib_helper(this, `FRAME Base Size: ${this.Frame.Stats.size}`, "size");
    }

    public get Armor(): number {
        const bonus = Bonus.SumMechBonuses("armor", this);
        const armor = this.Frame.Stats.armor + bonus;
        return bound_int(armor, 0, Rules.MaxMechArmor);
    }

    public get ArmorContributors(): string[] {
        return [ `FRAME Base Armor: ${this.Frame.Stats.armor}`, ...contrib_helper(this, "armor")];
    }

    public get SaveTarget(): number {
        const bonus = Bonus.SumMechBonuses("save", this) + this.Pilot.Grit;
        return this.Frame.Stats.save + bonus;
    }

    public get SaveTargetContributors(): string[] {
        return [
            `FRAME Base Save Target: ${this.Frame.Stats.save}`,
            `Pilot GRIT Bonus: +${this.Pilot.Grit}`,
            ...contrib_helper(this,  "save"),
        ];
    }

    public get Evasion(): number {
        if (this.IsStunned) return 5;
        const bonus = Bonus.SumMechBonuses("evasion", this) + this.Agi;
        return this.Frame.Stats.evasion + bonus;
    }

    public get EvasionContributors(): string[] {
        if (this.IsStunned) return ["STUNNED"];
        return [
            `FRAME Base Evasion: ${this.Frame.Stats.evasion}`,
            `Pilot AGILITY Bonus: +${this.Agi}`,
            ...contrib_helper(this, "evasion")
        ];
    }

    // Speed from agility
    public get AgiSpeed(): number {
        return Math.floor(this.Agi / 2);
    }

    public get Speed(): number {
        const bonus = Bonus.SumMechBonuses("speed", this) + this.AgiSpeed;
        return this.Frame.Stats.speed + bonus;
    }

    public get SpeedContributors(): string[] {
        return [
            `FRAME Base Speed: ${this.Frame.Stats.speed}`,
            `Pilot AGILITY Bonus: +${this.AgiSpeed}`,
            ...contrib_helper(this, "speed")
        ];
    }

    public get SensorRange(): number {
        const bonus = Bonus.SumMechBonuses("sensor", this);
        return this.Frame.Stats.sensor_range + bonus;
    }

    public get SensorRangeContributors(): string[] {
        return [`FRAME Base Sensor Range: ${this.Frame.Stats.sensor_range}`, ...contrib_helper(this, "sensor")];
    }

    public get EDefense(): number {
        const bonus = Bonus.SumMechBonuses("edef", this) + this.Sys;
        return this.Frame.Stats.edef + bonus;
    }

    public get EDefenseContributors(): string[] {
        return [
            `FRAME Base E-Defense: ${this.Frame.Stats.edef}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
            ...contrib_helper(this, "edef")];
    }

    public get LimitedBonus(): number {
        const bonus = Bonus.SumMechBonuses("limited_bonus", this);
        return Math.floor(this.Eng / 2) + bonus;
    }

    public get LimitedContributors(): string[] {
        return [`Pilot ENGINEERING Bonus: +${Math.floor(this.Eng / 2)}`, ...contrib_helper(this, "limited_bonus")];
    }

    public get AttackBonus(): number {
        const bonus = Bonus.SumMechBonuses("attack", this);
        return this.Pilot.Grit + bonus;
    }

    public get AttackBonusContributors(): string[] {
        return [`Pilot GRIT Bonus: ${this.Pilot.Grit}`, ...contrib_helper(this, "attack")];
    }

    public get TechAttack(): number {
        const bonus = Bonus.SumMechBonuses("tech_attack", this) + this.Sys;
        return this.Frame.Stats.tech_attack + bonus;
    }

    public get TechAttackContributors(): string[] {
        return [
            `FRAME Base Tech Attack: ${this.Frame.Stats.tech_attack}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
            ...contrib_helper(this, "tech_attack")
        ];
    }

    public get Grapple(): number {
        const bonus = Bonus.SumMechBonuses("grapple", this);
        return Rules.BaseGrapple + bonus;
    }

    public get GrappleContributors(): string[] {
        return [`Base Grapple Value: ${this.Grapple}`, ...contrib_helper(this, "grapple")];
    }

    public get Ram(): number {
        const bonus = Bonus.SumMechBonuses("ram", this);
        return Rules.BaseRam + bonus;
    }

    public get RamContributors(): string[] {
        return [`Base Ram Value: ${this.Ram}`, ...contrib_helper(this, "ram")];
    }

    public get SaveBonus(): number {
        const bonus = Bonus.SumMechBonuses("save", this);
        return this.Pilot.Grit + bonus;
    }

    public get SaveBonusContributors(): string[] {
        return [`Pilot GRIT Bonus: ${this.Pilot.Grit}`, ...contrib_helper(this, "save")];
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
        const bonus = Bonus.SumMechBonuses("structure", this);
        return this.Frame.Stats.structure + bonus;
    }

    public get StructureContributors(): string[] {
        return [`FRAME Base Structure: ${this.Frame.Stats.structure}`, ...contrib_helper(this, "structure")];
    }

    // Applies damage to this mech, factoring in resistances. Does not handle structure. Do that yourself, however you feel is appropriate!
    /*
    public ApplyDamage(type: DamageType, val: number, shredded: boolean): void {
        let val = dmg.Value;
        if (this.Resistances.includes(dmg.DamageType)) {
            val = Math.ceil(val / 2);
        }
        this.CurrentHP -= val;
        let struct_count
    }
    */

    public get MaxHP(): number {
        const bonus = Bonus.SumMechBonuses("hp", this) + this.Pilot.Grit + this.Hull * 2;
        return this.Frame.HP + bonus;
    }

    public get HPContributors(): string[] {
        return [
            `FRAME Base HP: ${this.Frame.HP}`,
            `Pilot GRIT Bonus: +${this.Pilot.Grit}`,
            `Pilot HULL Bonus: +${this.Hull * 2}`,
            ...contrib_helper(this, "hp")
        ];
    }

    public get CurrentSP(): number {
        return this.Loadout.TotalSP;
    }

    public get MaxSP(): number {
        const bonus = Bonus.SumMechBonuses("sp", this) + this.Pilot.Grit + Math.floor(this.Sys / 2);
        return this.Frame.SP + bonus;
    }

    public get FreeSP(): number {
        return this.MaxSP - this.CurrentSP;
    }

    public get SPContributors(): string[] {
        return [
            `FRAME Base SP: ${this.Frame.Stats.sp}`,
            `Pilot GRIT Bonus: +${this.Pilot.Grit}`,
            `Pilot SYSTEMS Bonus: +${Math.floor(this.Sys / 2)}`,
            ...contrib_helper(this, "sp")
        ];
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
        return this.CurrentHeat >= Math.ceil(this.Frame.Stats.heatcapacity / 2);
    }

    public get HeatCapacity(): number {
        const bonus = Bonus.SumMechBonuses("heatcap", this) + this.Eng;
        return this.Frame.Stats.heatcap + bonus;
    }

    public get HeatCapContributors(): string[] {
        return [
            `FRAME Base Heat Capacity: ${this.Frame.Stats.heatcap}`,
            `Pilot ENGINEERING Bonus: +${this.Eng}`,
            ...contrib_helper(this, "heat")
        ];
    }

    public get CurrentStress(): number {
        return this._current_stress;
    }

    public set CurrentStress(stress: number) {
        if (stress > this.MaxStress) this._current_stress = this.MaxStress;
        else if (stress < 0) this._current_stress = 0;
        else this._current_stress = stress;
        this.save();
    }

    public get MaxStress(): number {
        const bonus = Bonus.SumMechBonuses("stress", this);
        return this.Frame.Stats.stress + bonus;
    }

    public get StressContributors(): string[] {
        return [`FRAME Base Reactor Stress: ${this.Frame.Stats.stress}`,
    ...contrib_helper(this, "stress")];
    }

    public get RepairCapacity(): number {
        const bonus = Bonus.SumMechBonuses("repcap", this) + Math.floor(this.Hull / 2);
        return this.Frame.Stats.repcap + bonus;
    }

    public get RepCapContributors(): string[] {
        return [
            `FRAME Base Repair Capacity: ${this.Frame.Stats.repcap}`,
            `Pilot HULL Bonus: +${Math.floor(this.Hull / 2)}`,
            ...contrib_helper(this, "repcap")
        ];
    }

     
    public AddReaction(r: string): void {
        if (!this.Reactions.some(x => x === r)) this.Reactions.push(r);
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
        if (this.RequiredLicenses.filter(x => x.missing).length) out.push("Unlicensed");
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
        this.Statuses = [];
        this.Conditions = [];
        this.CurrentStress = 1;
        this.CurrentStructure = 1;
        this.CurrentHP = this.MaxHP;
        this.save();
    }

    public get IsShutDown(): boolean {
        return this.Statuses.includes("SHUT DOWN");
    }

    public get IsStunned(): boolean {
        return this.Conditions.includes("STUNNED");
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
            if (y.Destroyed) y.Repair();
            if (y.IsLimited) y.Uses = y.getTotalUses(this.LimitedBonus);
        });
        this.Statuses = [];
        this.Conditions = [];
        this.Resistances = [];
        this.Burn = 0;
        this.MeltdownImminent = false;
        this.save();
    }

    // -- Loadouts ----------------------------------------------------------------------------------

    public get ActiveMounts(): Mount[] {
        return this.Loadout.AllActiveMounts(this);
    }

    // -- Mountable CORE Bonuses --------------------------------------------------------------------
    // public get PilotBonuses(): CoreBonus[] {
        // return this.Pilot.CoreBonuses.filter(x => x.);
    // }

    // public get AppliedBonuses(): CoreBonus[] {
        // return _.flatten(this.Loadout.AllEquippableMounts(true, true).map(x => x.Bonuses));
    // }

    // public get AvailableBonuses(): CoreBonus[] {
        // return this.PilotBonuses.filter(x => !this.AppliedBonuses.includes(x));
    // }

    // -- Bonuses, Actions, Synergies, etc. ---------------------------------------------------------
    // TODO: This code is slimy af
    private features<T>(p: string): T[] {
        let output = this.Pilot[p];

            const activeBonuses = this.Loadout.Equipment.filter(
                x => x && !x.Destroyed && !x.IsCascading
            ).flatMap(x => x[p]);
            output = output.concat(activeBonuses);

        output = output
            .concat(this.Frame.Traits.flatMap(x => x[p]))
            .concat(this.Frame.CoreSystem[`Passive${p}`] || [])
            .concat(this.CoreActive ? this.Frame.CoreSystem[`Active${p}`] || [] : []);

        return output.filter(x => !!x);
    }

    public get Bonuses(): Bonus[] {
        return this.features("Bonuses");
    }

    public get Synergies(): Synergy[] {
        return this.features("Synergies");
    }

    public get Actions(): Action[] {
        return this.features("Actions");
    }


    // Helpers for getting sub items
    public get Deployables(): IDeployableData[] {
        return this.features("Deployables");
    }

    public get Counters(): ICounterData[] {
        return this.features("Counters");
    }

    public get IntegratedWeapons(): MechWeapon[] {
        // console.log(this.features('IntegratedWeapons'))
        return this.features("IntegratedWeapons");
    }

    public get IntegratedSystems(): MechSystem[] {
        // console.log(this.features('IntegratedSystems'))
        return this.features("IntegratedSystems");
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
            // loadouts: this.Loadouts.map(x => MechLoadout.Serialize(x)),
            statuses_and_conditions: SerUtil.ref_all(this.StatusesAndConditions),
            resistances: this.Resistances,
            reactions: this.Reactions,
            burn: this.Burn,
            ejected: this.Ejected,
            activations: this.Activations,
            meltdown_imminent: this.MeltdownImminent,
            // core_active: this.CoreActive,
            cc_ver: "MM-0",
            loadout: this.Loadout
        };
    }

    protected async load(data: RegMechData): Promise<Mech> {
       this.ID = data.id;
       this.Name = data.name;
       this.Notes = data.notes;
       this.GmNote = data.gm_note;
       this.Portrait = data.portrait;
       this.CloudPortrait = data.cloud_portrait;
       this.Active = data.active;
       this.Loadout = await new MechLoadout(data.loadout).IntegratedSystems()
        } else {
           this._loadouts = data.loadouts.map((x: IMechLoadoutData) => MechLoadout.Deserialize(x, m));
           this.Active_loadout = data.active_loadout_index
                ?this._loadouts[data.active_loadout_index]
                :this._loadouts[0];
        }
       this.CurrentStructure = data.current_structure;
       this.CurrentHP = data.current_hp;
       this._overshield = data.overshield || 0;
       this._current_stress = data.current_stress;
       this.CurrentHeat = data.current_heat;
       this.CurrentRepairs = data.current_repairs;
       this._current_overcharge = data.current_overcharge || 0;
       this._current_core_energy = data.current_core_energy != null ? data.current_core_energy : 1;
       this.Statuses = data.statuses || [];
       this.Conditions = data.conditions || [];
       this.Resistances = data.resistances || [];
       this.Reactions = data.reactions || [];
       this.Burn = data.burn || 0;
       this._ejected = data.ejected || false;
       this._destroyed = data.destroyed || false;
       this.Defeat = data.defeat || "";
       this.Activations = data.activations || 1;
       this.MeltdownImminent = data.meltdown_imminent || false;
       this.ReactorDestroyed = data.reactor_destroyed || false;
       this.CoreActive = data.coreActive || false;
       this.CCVer = data.cc_ver || "";
        return m;
    }
}
