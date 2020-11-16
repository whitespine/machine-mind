import { Action, Bonus, Counter, Synergy, TagInstance } from "@src/class";
import { defaults } from "@src/funcs";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedTagInstanceData,
    RegTagInstanceData,
    PackedCounterData,
    RegCounterData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, SerUtil } from "@src/registry";
import { ActivationType } from "../enums";

export interface PackedDeployableData {
    name: string;
    type: string; // this is for UI furnishing only,
    detail: string;
    activation: ActivationType;
    deactivation?: ActivationType;
    recall?: ActivationType;
    redeploy?: ActivationType;
    size: number;
    cost?: number;
    armor?: number;
    hp?: number;
    evasion?: number;
    edef?: number;
    heatcap?: number;
    repcap?: number;
    sensor_range?: number;
    tech_attack?: number;
    save?: number;
    speed?: number;
    actions?: IActionData[];
    bonuses?: IBonusData[];
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
    size: number;
    cost: number;
    armor: number;
    max_hp: number;
    evasion: number;
    edef: number;
    heatcap: number;
    repcap: number;
    sensor_range: number;
    tech_attack: number;
    save: number;
    speed: number;
    actions: IActionData[];
    bonuses: IBonusData[];
    synergies: ISynergyData[];
    counters: RegCounterData[];
    tags: RegTagInstanceData[];
    overshield: number;
    current_hp: number;
}

export class Deployable extends RegEntry<EntryType.DEPLOYABLE> {
    Name!: string;
    DeployableType!: string; // this is for UI furnishing only. Drone, etc
    Detail!: string;
    Activation!: ActivationType;
    Deactivation!: ActivationType;
    Recall!: ActivationType;
    Redeploy!: ActivationType;
    Size!: number;
    Cost!: number;
    Armor!: number;
    CurrentHP!: number; // Note: I somewhat regret making these all nullable.
    MaxHP!: number;
    Overshield!: number;
    Evasion!: number;
    EDef!: number;
    HeatCap!: number;
    RepairCap!: number;
    SensorRange!: number;
    TechAttack!: number;
    Save!: number;
    Speed!: number;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Tags!: TagInstance[];

    public async load(data: RegDeployableData): Promise<void> {
        data = { ...defaults.DEPLOYABLE, ...data };
        this.Name = data.name;
        this.DeployableType = data.type;
        this.Detail = data.detail;
        this.Activation = data.activation;
        this.Deactivation = data.deactivation ?? ActivationType.None;
        this.Recall = data.recall ?? ActivationType.None;
        this.Redeploy = data.redeploy ?? ActivationType.None;
        this.Size = data.size;
        this.Cost = data.cost; // Cost in resources
        this.Armor = data.armor;
        this.MaxHP = data.max_hp;
        this.CurrentHP = data.current_hp ?? this.MaxHP;
        this.Overshield = data.overshield;
        this.Evasion = data.evasion;
        this.EDef = data.edef;
        this.HeatCap = data.heatcap;
        this.RepairCap = data.repcap;
        this.SensorRange = data.sensor_range;
        this.TechAttack = data.tech_attack;
        this.Save = data.save;
        this.Speed = data.speed;
        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses, this.Name);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Counters = data.counters?.map(x => new Counter(x)) || [];
    }

    public async save(): Promise<RegDeployableData> {
        return {
            name: this.Name,
            type: this.Type,
            detail: this.Detail,
            activation: this.Activation,
            deactivation: this.Deactivation,
            recall: this.Recall,
            redeploy: this.Redeploy,
            size: this.Size,
            cost: this.Cost,
            armor: this.Armor,
            max_hp: this.MaxHP,
            current_hp: this.CurrentHP,
            overshield: this.Overshield,
            evasion: this.Evasion,
            edef: this.EDef,
            heatcap: this.HeatCap,
            repcap: this.RepairCap,
            sensor_range: this.SensorRange,
            tech_attack: this.TechAttack,
            save: this.Save,
            speed: this.Speed,
            actions: SerUtil.sync_save_all(this.Actions),
            bonuses: SerUtil.sync_save_all(this.Bonuses),
            synergies: SerUtil.sync_save_all(this.Synergies),
            tags: await SerUtil.save_all(this.Tags),
            counters: this.Counters.map(c => c.save()),
        };
    }

    // Loads this item into the registry. Only use as needed (IE once)
    public static async unpack(
        dep: PackedDeployableData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Deployable> {
        let tags = dep.tags?.map(TagInstance.unpack_reg) ?? [];
        let counters = SerUtil.unpack_counters_default(dep.counters);
        let unpacked: RegDeployableData = {
            ...defaults.DEPLOYABLE(),
            ...dep,
            max_hp: dep.hp ?? 0,
            overshield: 0,
            current_hp: dep.hp ?? 0,
            counters,
            tags,
        };
        return reg.get_cat(EntryType.DEPLOYABLE).create_live(ctx, unpacked);
    }
}
