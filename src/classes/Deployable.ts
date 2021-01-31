import { Action, Bonus, Counter, Mech, Pilot, Synergy, TagInstance } from "@src/class";
import { defaults } from "@src/funcs";
import {
    IActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedTagInstanceData,
    RegTagInstanceData,
    PackedCounterData,
    RegCounterData,
} from "@src/interface";
import { EntryType, InventoriedRegEntry, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { ActivationType } from "../enums";
import { BonusContext } from "./Bonus";
import { Npc } from "./npc/Npc";

export interface PackedDeployableData {
    name: string;
    type: string; // this is for UI furnishing only,
    detail: string;
    activation?: ActivationType;
    deactivation?: ActivationType;
    recall?: ActivationType;
    redeploy?: ActivationType;
    size: number;
    instances?: number;
    cost?: number;
    armor?: number;
    hp?: number;
    evasion?: number;
    edef?: number;
    heatcap?: number;
    repcap?: number;
    pilot?: boolean;
    mech?: boolean;
    sensor_range?: number;
    tech_attack?: number;
    save?: number;
    speed?: number;
    actions?: IActionData[];
    bonuses?: PackedBonusData[];
    synergies?: ISynergyData[];
    counters?: PackedCounterData[];
    tags?: PackedTagInstanceData[];
}

export interface RegDeployableData {
    name: string;
    type: string; // this is for UI furnishing only,
    detail: string;
    activation: ActivationType;
    deactivation: ActivationType;
    recall: ActivationType;
    redeploy: ActivationType;
    instances: number;
    size: number;
    cost: number;
    armor: number;
    max_hp: number;
    evasion: number;
    edef: number;
    heatcap: number;
    repcap: number;
    avail_unmounted: boolean;
    avail_mounted: boolean;
    sensor_range: number;
    tech_attack: number;
    save: number; // Mandatory - a 0 means use inherited, or 10 if default
    speed: number;
    actions: IActionData[];
    bonuses: RegBonusData[]; // Why does this exist, again?
    synergies: ISynergyData[];
    counters: RegCounterData[];
    tags: RegTagInstanceData[];

    overshield: number;
    current_hp: number;
    current_heat: number;
    burn: number;

    deployer: RegRef<EntryType.PILOT | EntryType.MECH | EntryType.NPC> | null;
}

export class Deployable extends InventoriedRegEntry<EntryType.DEPLOYABLE> {
    Name!: string;
    DeployableType!: string; // this is for UI furnishing only. Drone, etc
    Detail!: string;
    Cost!: number; // The limited cost of deploying this
    Instances!: number; // How many should be created in a single deployment

    // Action Info
    Activation!: ActivationType;
    Deactivation!: ActivationType;
    Recall!: ActivationType;
    Redeploy!: ActivationType;

    // HP and related "curr" state
    CurrentHP!: number; 
    CurrentHeat!: number;
    Overshield!: number;
    Burn!: number;
    CurrentRepairs: number = 0; // Todo - what are we doing here

    // Base Stats
    BaseSize!: number;
    BaseArmor!: number;
    BaseMaxHP!: number;
    BaseEvasion!: number;
    BaseEDefense!: number;
    BaseHeatCapacity!: number;
    BaseRepairCapacity!: number; // ????
    BaseSensorRange!: number; // Does this need to be here? Maybe. Can broadly be used to represent it's effective range
    BaseTechAttack!: number;
    BaseSaveTarget!: number;
    BaseSpeed!: number;

    // Availability info.
    AvailableMounted!: boolean;
    AvailableUnmounted!: boolean;

    // The common BASCT
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Tags!: TagInstance[];

    // Ownership
    Deployer!: Pilot | Mech | Npc | null;
    

    // All bonuses affecting this mech, from itself, its pilot, and (todo) any status effects
    public get AllBonuses(): Bonus[] {
        // Get bonuses, prefering cached
        if (this.Deployer) {
            if(this.Deployer.Type == EntryType.PILOT) {
                // Get bonuses just from pilot
                return [...this.Deployer.PilotBonuses, ...this.Bonuses];
            } else if (this.Deployer.Type == EntryType.MECH) {
                // Get bonuses from mech + pilot
                return [...this.Deployer.AllBonuses, ...this.Bonuses];
            }
        } 

        // In case of no deployer / deployer is npc, cannot compute any additional bonuses
        return this.Bonuses;
    }    

    // Cached version of above. Must be manually invalidated
    private cached_bonuses: Bonus[] | null = null;

    // Makes the cache need re-computation. Since we don't do any work ourselves, this is more about
    // asking our deployer to recompute
    public recompute_bonuses(include_deployer: boolean = true) {
        this.cached_bonuses = null;
        if(this.Deployer && include_deployer) {
            this.Deployer.recompute_bonuses();
        }
    }
    
    // Sum our pilot bonuses and our intrinsic bonuses for one big honkin bonus for the specified id, return the number
    private sum_bonuses(base_value: number, id: string): number {
        // Filter down to only relevant bonuses
        let filtered = this.AllBonuses.filter(b => b.ID == id);

        let ctx: BonusContext = {};
        if (this.Deployer?.Type == EntryType.PILOT) {
            // Set pilot ctx if directly associated with a pilot
            ctx = Bonus.ContextFor(this.Deployer);
        } else if(this.Deployer?.Type == EntryType.MECH) {
            // If assoc with a mech, need to route through said mech
            if(this.Deployer.Pilot) {
                ctx = Bonus.ContextFor(this.Deployer.Pilot);
            }
        }

        // Use the context to accumulate. If we couldn't find a pilot, values will likely be off, but still useable
        return Bonus.Accumulate(base_value, filtered, ctx).final_value;
    }

    // Derived stats
    get Size(): number {
        return this.sum_bonuses(this.BaseSize, "deployable_size");
    }
    get Armor(): number {
        return this.sum_bonuses(this.BaseArmor, "deployable_armor");
    }
    get MaxHP(): number {
        return this.sum_bonuses(this.BaseMaxHP, "deployable_hp");
    }
    get Evasion(): number {
        return this.sum_bonuses(this.BaseEvasion, "deployable_evasion");
    }
    get EDefense(): number {
        return this.sum_bonuses(this.BaseEDefense, "deployable_edef");
    }
    get HeatCapacity(): number {
        return this.sum_bonuses(this.BaseHeatCapacity, "deployable_heatcap");
    }
    get RepairCapacity(): number {
        return this.sum_bonuses(this.BaseRepairCapacity, "deployable_repcap");
    }
    get SensorRange(): number { 
        return this.sum_bonuses(this.BaseSize, "deployable_sensor_range");
    }
    get TechAttack(): number {
        return this.sum_bonuses(this.BaseTechAttack, "deployable_tech_attack");
    }
    get SaveTarget(): number {
        return this.sum_bonuses(this.BaseSaveTarget, "deployable_save");
    }
    get Speed(): number {
        return this.sum_bonuses(this.BaseSpeed, "deployable_speed");
    }



    // They don't own anything yet, but statuses will maybe change this? or if they have systems? idk, they're actors so it made sense at the time
    protected enumerate_owned_items(): RegEntry<any>[] {
        return [];
    }

    public async load(data: RegDeployableData): Promise<void> {
        data = { ...defaults.DEPLOYABLE(), ...data };
        this.AvailableMounted = data.avail_mounted;
        this.AvailableUnmounted = data.avail_unmounted;

        this.Name = data.name;
        this.Detail = data.detail;
        this.DeployableType = data.type;
        this.Cost = data.cost;
        this.Instances = data.instances;

        this.Activation = data.activation;
        this.Recall = data.recall;
        this.Redeploy = data.redeploy;
        this.Deactivation = data.deactivation;

        this.CurrentHP = data.current_hp;
        this.CurrentHeat = data.current_heat;
        this.Overshield = data.overshield;
        this.Burn = data.burn;

        this.BaseSize = data.size;
        this.BaseArmor = data.armor;
        this.BaseMaxHP = data.max_hp;
        this.BaseEvasion = data.evasion;
        this.BaseEDefense = data.edef;
        this.BaseHeatCapacity = data.heatcap;
        this.BaseRepairCapacity = data.repcap;
        this.BaseSaveTarget = data.save;
        this.BaseSpeed = data.speed;
        this.BaseSensorRange = data.sensor_range;
        this.BaseTechAttack = data.tech_attack;

        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses, this.Name);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Counters = data.counters?.map(x => new Counter(x)) || [];

        this.Deployer = data.deployer ? await this.Registry.resolve(this.OpCtx, data.deployer) : null;
    }

    protected save_imp(): RegDeployableData {
        return {
            name: this.Name,
            type: this.Type,
            burn: this.Burn,
            detail: this.Detail,
            activation: this.Activation,
            deactivation: this.Deactivation,
            recall: this.Recall,
            redeploy: this.Redeploy,
            size: this.BaseSize,
            instances: this.Instances,
            cost: this.Cost,
            armor: this.BaseArmor,
            max_hp: this.BaseMaxHP,
            current_hp: this.CurrentHP,
            overshield: this.Overshield,
            current_heat: this.CurrentHeat,
            evasion: this.BaseEvasion,
            edef: this.BaseEDefense,
            heatcap: this.BaseHeatCapacity,
            repcap: this.BaseRepairCapacity,
            sensor_range: this.BaseSensorRange,
            tech_attack: this.BaseTechAttack,
            save: this.BaseSaveTarget,
            speed: this.BaseSpeed,
            actions: SerUtil.save_all(this.Actions),
            bonuses: SerUtil.save_all(this.Bonuses),
            synergies: SerUtil.save_all(this.Synergies),
            tags: SerUtil.save_all(this.Tags),
            counters: this.Counters.map(c => c.save()),
            avail_mounted: this.AvailableMounted,
            avail_unmounted: this.AvailableUnmounted,
            deployer: this.Deployer?.as_ref() ?? null,
        };
    }

    // Loads this item into the registry. Only use as needed (IE once)
    public static async unpack(
        dep: PackedDeployableData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Deployable> {
        let tags = SerUtil.unpack_tag_instances(reg, dep.tags);
        let counters = SerUtil.unpack_counters_default(dep.counters);
        let unpacked: RegDeployableData = {
            ...defaults.DEPLOYABLE(),
            ...dep,
            bonuses: (dep.bonuses ?? []).map(Bonus.unpack),
            max_hp: dep.hp ?? 0,
            overshield: 0,
            current_hp: dep.hp ?? 0,
            avail_mounted: dep.mech ?? true,
            avail_unmounted: dep.pilot ?? false,
            counters,
            tags,
        };
        return reg.get_cat(EntryType.DEPLOYABLE).create_live(ctx, unpacked);
    }
}
