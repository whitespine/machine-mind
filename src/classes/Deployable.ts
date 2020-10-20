import { Action, Bonus, Counter, Synergy, TagInstance } from "@/class";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedTagInstanceData,
     RegTagInstanceData,
    PackedCounterData,
    RegCounterData,
} from "@/interface";
import { EntryType, RegEntry, Registry } from "@/new_meta";
import { ActivationType } from "./enums";

interface AllDeployableData {
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
}

export interface PackedDeployableData extends AllDeployableData {
    counters?: PackedCounterData[];
    tags?: PackedTagInstanceData[];
}

export interface RegDeployableData extends AllDeployableData {
    counters: RegCounterData[];
    tags: RegTagInstanceData[];
    overshield?: number;
    current_hp?: number;
}

export class Deployable extends RegEntry<EntryType.DEPLOYABLE, RegDeployableData> {
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
    CurrentHP!: number | null;
    MaxHP!: number | null;
    Overshield!: number | null;
    Evasion!: number | null;
    EDef!: number | null;
    HeatCap!: number | null;
    RepairCap!: number | null;
    SensorRange!: number | null;
    TechAttack!: number | null;
    Save!: number | null;
    Speed!: number | null;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Tags!: TagInstance[];

    protected async load(data: RegDeployableData): Promise<void> {
        this.Name = data.name;
        this.DeployableType = data.type;
        this.Detail = data.detail;
        this.Activation = data.activation;
        this.Deactivation = data.deactivation ?? ActivationType.None;
        this.Recall = data.recall ?? ActivationType.None;
        this.Redeploy = data.redeploy ?? ActivationType.None;
        this.Size = data.size;
        this.Cost = data.cost ?? 1; // Holdover from compcon - unclear what it actuallly does
        this.Armor = data.armor ?? 0;
        this.MaxHP = data.hp ?? null;
        this.CurrentHP = data.current_hp ?? this.MaxHP;
        this.Overshield = data.overshield ?? null;
        this.Evasion = data.evasion ?? null;
        this.EDef = data.edef ?? null;
        this.HeatCap = data.heatcap ?? null;
        this.RepairCap = data.repcap ?? null;
        this.SensorRange = data.sensor_range ?? null;
        this.TechAttack = data.tech_attack ?? null;
        this.Save = data.save ?? null;
        this.Speed = data.speed ?? null;
        this.Actions = data.actions?.map(x => new Action(x)) || [];
        this.Bonuses = data.bonuses?.map(x => new Bonus(x)) || [];
        this.Synergies = data.synergies?.map(x => new Synergy(x)) || [];
        this.Tags = data.tags?.map(x => new TagInstance(this.Registry, x));
        this.Counters = data.counters?.map(x => new Counter(x)) || [];

        // Make sure tags ready
        await Promise.all(this.Tags.map(x => x.ready()));
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
            hp: this.MaxHP ?? undefined,
            current_hp: this.CurrentHP ?? undefined,
            overshield: this.Overshield ?? undefined,
            evasion: this.Evasion ?? undefined,
            edef: this.EDef ?? undefined,
            heatcap: this.HeatCap ?? undefined,
            repcap: this.RepairCap ?? undefined,
            sensor_range: this.SensorRange ?? undefined,
            tech_attack: this.TechAttack ?? undefined,
            save: this.Save ?? undefined,
            speed: this.Speed ?? undefined,
            actions: this.Actions.map(a => a.save()),
            bonuses: this.Bonuses.map(b => b.save()),
            synergies: this.Synergies.map(s => s.save()),
            tags: await Promise.all(this.Tags.map(t => t.save())),
            counters: this.Counters.map(c => c.save())
        };
    }

    // Loads this item into the registry. Only use as needed (IE once)
    public static async unpack(dep: PackedDeployableData, reg: Registry): Promise<Deployable> {
        let tags = await Promise.all(dep.tags?.map(t => TagInstance.unpack(t, reg)) || []) ;
        let reg_tags = await Promise.all(tags.map(t => t.save())); // A bit silly, but tags don't actually make entries for us to refer to or whatever, so we need to save them back
        let counters = await Promise.all(dep.counters?.map(c => Counter.unpack(c, [])) || []);
         let unpacked: RegDeployableData = {
            ...dep,
            counters,
            tags: reg_tags
        };
        return reg.get_cat(EntryType.DEPLOYABLE).create(unpacked);
    }
}
