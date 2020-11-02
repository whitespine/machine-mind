import { Bonus, Damage, Frame, MechLoadout, Pilot, Rules } from "@/class";
import { bound_int, contrib_helper } from "@/funcs";
import { IMechLoadoutData } from "@/interface";
import { EntryType, RegEntry, RegRef } from "@/registry";
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
    active_loadout_index: number;
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
    statuses: RegRef<EntryType.STATUS>;
    conditions: RegRef<EntryType.CONDITION>[];
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
    Statuses!: string[];
    Conditions!: string[];
    Resistances!: DamageType[];
    Reactions!: string[];
    Ejected!: boolean;
    MeltdownImminent!: boolean;
    Burn!: number;
    TurnActions!: number;
    CurrentMove!: number;
    CoreActive!: boolean;



    // -- Info --------------------------------------------------------------------------------------
    public get EncounterName(): string {
        return this.Pilot.Callsign;
    }

    public get Icon(): string {
        return "cci-pilot";
    }

    public get IsCascading(): boolean {
        if (!this.Loadout.AICount) return false;
        return !!this.Loadout.Equipment.filter(x => x.IsCascading).length;
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
        return `cci-size-${this.Size === 0.5 ? "half" : this.Size}`;
    }

    public get Size(): number {
        const bonus = Bonus.get("size", this);
        const size = Math.ceil(this.Frame.Size + bonus);
        return bound_int(size, 0.5, Rules.MaxFrameSize);
    }


    public get SizeContributors(): string[] {
        return contrib_helper(this, `FRAME Base Size: ${this.Frame.Size}`, "size");
    }

    public get Armor(): number {
        const bonus = Bonus.get("armor", this);
        const armor = this.Frame.Armor + bonus;
        return bound_int(armor, 0, Rules.MaxMechArmor);
    }

    public get ArmorContributors(): string[] {
        return [ `FRAME Base Armor: ${this.Frame.Armor}`, ...contrib_helper(this, "armor");
    }

    public get SaveTarget(): number {
        const bonus = Bonus.get("save", this) + this.Pilot.Grit;
        return this.Frame.SaveTarget + bonus;
    }

    public get SaveTargetContributors(): string[] {
        return [
            `FRAME Base Save Target: ${this.Frame.SaveTarget}`,
            `Pilot GRIT Bonus: +${this.Pilot.Grit}`,
            ...contrib_helper(this,  "save"),
        ];
    }

    public get Evasion(): number {
        if (this.IsStunned) return 5;
        const bonus = Bonus.get("evasion", this) + this.Agi;
        return this.Frame.Evasion + bonus;
    }

    public get EvasionContributors(): string[] {
        if (this.IsStunned) return ["STUNNED"];
        return [
            `FRAME Base Evasion: ${this.Frame.Evasion}`,
            `Pilot AGILITY Bonus: +${this.Agi}`,
            ...contrib_helper(this, "evasion")
        ];
    }

    // Speed from agility
    public get AgiSpeed(): number {
        return Math.floor(this.Agi / 2);
    }

    public get Speed(): number {
        const bonus = Bonus.get("speed", this) + this.AgiSpeed;
        return this.Frame.Speed + bonus;
    }

    public get SpeedContributors(): string[] {
        return [
            `FRAME Base Speed: ${this.Frame.Speed}`,
            `Pilot AGILITY Bonus: +${this.AgiSpeed}`,
            ...contrib_helper(this, "speed")
        ];
    }

    public get SensorRange(): number {
        const bonus = Bonus.get("sensor", this);
        return this.Frame.SensorRange + bonus;
    }

    public get SensorRangeContributors(): string[] {
        return [`FRAME Base Sensor Range: ${this.Frame.SensorRange}`, ...contrib_helper(this, "sensor")];
    }

    public get EDefense(): number {
        const bonus = Bonus.get("edef", this) + this.Sys;
        return this.Frame.EDefense + bonus;
    }

    public get EDefenseContributors(): string[] {
        return [
            `FRAME Base E-Defense: ${this.Frame.EDefense}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
            ...contrib_helper(this, "edef")];
    }

    public get LimitedBonus(): number {
        const bonus = Bonus.get("limited_bonus", this);
        return Math.floor(this.Eng / 2) + bonus;
    }

    public get LimitedContributors(): string[] {
        return [`Pilot ENGINEERING Bonus: +${Math.floor(this.Eng / 2)}`, ...contrib_helper(this, "limited_bonus")];
    }

    public get AttackBonus(): number {
        const bonus = Bonus.get("attack", this);
        return this.Pilot.Grit + bonus;
    }

    public get AttackBonusContributors(): string[] {
        return [`Pilot GRIT Bonus: ${this.Pilot.Grit}`, ...contrib_helper(this, "attack")];
    }

    public get TechAttack(): number {
        const bonus = Bonus.get("tech_attack", this) + this.Sys;
        return this.Frame.TechAttack + bonus;
    }

    public get TechAttackContributors(): string[] {
        return [
            `FRAME Base Tech Attack: ${this.Frame.TechAttack}`,
            `Pilot SYSTEMS Bonus: +${this.Sys}`,
            ...contrib_helper(this, "tech_attack")
        ];
    }

    public get Grapple(): number {
        const bonus = Bonus.get("grapple", this);
        return Rules.BaseGrapple + bonus;
    }

    public get GrappleContributors(): string[] {
        return [`Base Grapple Value: ${this.Grapple}`, ...contrib_helper(this, "grapple")];
    }

    public get Ram(): number {
        const bonus = Bonus.get("ram", this);
        return Rules.BaseRam + bonus;
    }

    public get RamContributors(): string[] {
        return [`Base Ram Value: ${this.Ram}`, ...contrib_helper(this, "ram")];
    }

    public get SaveBonus(): number {
        const bonus = Bonus.get("save", this);
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
        const bonus = Bonus.get("structure", this);
        return this.Frame.Structure + bonus;
    }

    public get StructureContributors(): string[] {
        return [`FRAME Base Structure: ${this.Frame.Structure}`, ...contrib_helper(this, "structure")];
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
        const bonus = Bonus.get("hp", this) + this.Pilot.Grit + this.Hull * 2;
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
        if (!this.ActiveLoadout) return this.MaxSP;
        return this.ActiveLoadout.TotalSP;
    }

    public get MaxSP(): number {
        const bonus = Bonus.get("sp", this) + this.Pilot.Grit + Math.floor(this.Sys / 2);
        return this.Frame.SP + bonus;
    }

    public get FreeSP(): number {
        return this.MaxSP - this.CurrentSP;
    }

    public get SPContributors(): string[] {
        return [
            `FRAME Base SP: ${this.Frame.SP}`,
            `Pilot GRIT Bonus: +${this.Pilot.Grit}`,
            `Pilot SYSTEMS Bonus: +${Math.floor(this.Sys / 2)}`,
            ...contrib_helper(this, "sp")
        ];
    }


    /*
    public AddHeat(heat: number): void {
        heat = this.Resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        let newHeat = this.CurrentHeat + heat;
        while (newHeat > this.HeatCapacity) {
            this.CurrentStress -= 1;
            newHeat -= this.HeatCapacity;
        }
        this.CurrentHeat = newHeat;
    }

    public ReduceHeat(heat: number, resist?: boolean): void {
        if (resist) heat = this.Resistances.includes("Heat") ? Math.ceil(heat / 2) : heat;
        while (heat > this.CurrentHeat) {
            heat -= this.CurrentHeat;
            this.CurrentStress += 1;
            this.CurrentHeat = this.HeatCapacity;
        }
        this.CurrentHeat -= heat;
    }
    */

    public get IsInDangerZone(): boolean {
        return this.CurrentHeat >= Math.ceil(this.HeatCapacity / 2);
    }

    public get HeatCapacity(): number {
        const bonus = Bonus.get("heatcap", this) + this.Eng;
        return this.Frame.HeatCap + bonus;
    }

    public get HeatCapContributors(): string[] {
        return [
            `FRAME Base Heat Capacity: ${this.Frame.HeatCap}`,
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
        const bonus = Bonus.get("stress", this);
        return this.Frame.HeatStress + bonus;
    }

    public get StressContributors(): string[] {
        return [`FRAME Base Reactor Stress: ${this.Frame.HeatStress}`,
    ...contrib_helper(this, "stress")];
    }

    public get RepairCapacity(): number {
        const bonus = Bonus.get("repcap", this) + Math.floor(this.Hull / 2);
        return this.Frame.RepCap + bonus;
    }

    public get RepCapContributors(): string[] {
        return [
            `FRAME Base Repair Capacity: ${this.Frame.RepCap}`,
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
        this.CurrentMove = this.Speed;
    }

    // -- Statuses and Conditions -------------------------------------------------------------------
    public get StatusString(): string[] {
        const out: string[] = [];
        if (this.ReactorDestroyed) out.push("reactorDestroyed");
        if (this.Destroyed) out.push("destroyed");
        if (this.Ejected) out.push("ejected");
        if (this.MeltdownImminent) out.push("meltdown");
        if (this.ActiveLoadout.Systems.filter(x => x.IsCascading).length) out.push("cascading");
        if (this.FreeSP < 0) out.push("overSP");
        if (this.FreeSP > 0) out.push("underSP");
        if (this.ActiveLoadout.HasEmptyMounts) out.push("unfinished");
        if (this.RequiredLicenses.filter(x => x.missing).length) out.push("unlicensed");
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
        });
        this.Statuses = [];
        this.Conditions = [];
        this.Resistances = [];
        this.Burn = 0;
        this._destroyed = false;
        this.Defeat = "";
        this.ReactorDestroyed = false;
        this.MeltdownImminent = false;
        this.save();
    }

    // -- Loadouts ----------------------------------------------------------------------------------
    public get Loadouts(): MechLoadout[] {
        return this._loadouts;
    }

    public set Loadouts(loadouts: MechLoadout[]) {
        this._loadouts = loadouts;
        this.save();
    }

    public get ActiveLoadout(): MechLoadout {
        return this.Active_loadout;
    }

    public set ActiveLoadout(loadout: MechLoadout) {
        this.Active_loadout = loadout;
        this.save();
    }

    public get ActiveMounts(): Mount[] {
        return this.ActiveLoadout.AllActiveMounts(this);
    }

    public AddLoadout(): void {
        this._loadouts.push(new MechLoadout(this));
        this.ActiveLoadout = this._loadouts[this._loadouts.length - 1];
        this.save();
    }

    public RemoveLoadout(): void {
        if (this._loadouts.length === 1) {
            console.error(`Cannot remove last Mech Loadout`);
        } else {
            const index = this._loadouts.findIndex(x => x.ID === this.ActiveLoadout.ID);
            this.Active_loadout = this._loadouts[index + (index === 0 ? 1 : -1)];
            this._loadouts.splice(index, 1);
            this.save();
        }
    }

    public CloneLoadout(): void {
        const index = this._loadouts.findIndex(x => x.ID === this.ActiveLoadout.ID);
        const newLoadout = MechLoadout.Deserialize(MechLoadout.Serialize(this.ActiveLoadout), this);
        newLoadout.RenewID();
        newLoadout.Name += " (Copy)";
        this._loadouts.splice(index + 1, 0, newLoadout);
        this.Active_loadout = this._loadouts[index + 1];
        this.save();
    }

    public UpdateLoadouts(): void {
        this._loadouts.forEach(x => {
            x.UpdateIntegrated(this);
        });
    }

    // -- Mountable CORE Bonuses --------------------------------------------------------------------
    public get PilotBonuses(): CoreBonus[] {
        return this.Pilot.CoreBonuses.filter(x => x.IsMountable);
    }

    public get AppliedBonuses(): CoreBonus[] {
        return _.flatten(this.ActiveLoadout.AllEquippableMounts(true, true).map(x => x.Bonuses));
    }

    public get AvailableBonuses(): CoreBonus[] {
        return this.PilotBonuses.filter(x => !this.AppliedBonuses.includes(x));
    }

    // -- Bonuses, Actions, Synergies, etc. ---------------------------------------------------------
    // TODO: This code is slimy af
    private features<T>(p: string): T[] {
        let output = this.Pilot[p];

        if (this.ActiveLoadout) {
            const activeBonuses = this.ActiveLoadout.Equipment.filter(
                x => x && !x.Destroyed && !x.IsCascading
            ).flatMap(x => x[p]);
            output = output.concat(activeBonuses);
        }

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
            nathise: m.Name,
            notes: this.Notes,
            gthis_note: m.GmNote,
            portrait: this.Portrait,
            cloudPortrait: this.CloudPortrait,
            frathise: m.Frame.ID,
            active: this.Active,
            current_structure: this.CurrentStructure,
            current_hp: this.CurrentHP,
            overshield: this._overshield,
            current_stress: this._current_stress,
            current_heat: this.CurrentHeat,
            current_repairs: this.CurrentRepairs,
            current_overcharge: this._current_overcharge,
            current_core_energy: this._current_core_energy,
            loadouts: this.Loadouts.map(x => MechLoadout.Serialize(x)),
            active_loadout_index: this.Loadouts.findIndex(x => x.ID === m.ActiveLoadout.ID),
            statuses: this.Statuses,
            conditions: this.Conditions,
            resistances: this.Resistances,
            reactions: this.Reactions,
            burn: this.Burn,
            ejected: this._ejected,
            destroyed: this._destroyed,
            defeat: this.Defeat,
            activations: this.Activations,
            thiseltdown_imminent: m.MeltdownImminent,
            reactor_destroyed: this.ReactorDestroyed,
            coreActive: this.CoreActive,
            cc_ver: store.getters.getVersion || "ERR",
        };
    }

    protected load(data: RegMechData): Mech {
        const f = store.getters.referenceByID("Frames", data.frame);
        const m = new Mech(f, pilot);
        m.ID = data.id;
        m.Name = data.name;
        m.Notes = data.notes;
        m.GMNote = data.gm_note;
        m.Portrait = data.portrait;
        m.CloudPortrait = data.cloud_portrait;
        m.Active = data.active;
        if (
            data.active_loadout_index === null ||
            data.active_loadout_index === undefined ||
            !data.loadouts.length
        ) {
            m._loadouts = [new MechLoadout(m)];
            m.Active_loadout = m._loadouts[0];
        } else {
            m._loadouts = data.loadouts.map((x: IMechLoadoutData) => MechLoadout.Deserialize(x, m));
            m.Active_loadout = data.active_loadout_index
                ? m._loadouts[data.active_loadout_index]
                : m._loadouts[0];
        }
        m.CurrentStructure = data.current_structure;
        m.CurrentHP = data.current_hp;
        m._overshield = data.overshield || 0;
        m._current_stress = data.current_stress;
        m.CurrentHeat = data.current_heat;
        m.CurrentRepairs = data.current_repairs;
        m._current_overcharge = data.current_overcharge || 0;
        m._current_core_energy = data.current_core_energy != null ? data.current_core_energy : 1;
        m.Statuses = data.statuses || [];
        m.Conditions = data.conditions || [];
        m.Resistances = data.resistances || [];
        m.Reactions = data.reactions || [];
        m.Burn = data.burn || 0;
        m._ejected = data.ejected || false;
        m._destroyed = data.destroyed || false;
        m.Defeat = data.defeat || "";
        m.Activations = data.activations || 1;
        m.MeltdownImminent = data.meltdown_imminent || false;
        m.ReactorDestroyed = data.reactor_destroyed || false;
        m.CoreActive = data.coreActive || false;
        m.CCVer = data.cc_ver || "";
        return m;
    }
}
