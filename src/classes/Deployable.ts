import { ActivationType, Counter } from '@/class';
import { IActionData, IBonusData, ISynergyData, ICounterData } from '@/interface';
import { MixBuilder, Mixlet, MixLinks, ident, CountersMixReader, CountersMixWriter, ident_drop_null, uuid } from '@/mixmeta';
import { Action, ActionsMixReader, ActionsMixWriter } from './Action';
import { Bonus, BonusesMixReader, BonusesMixWriter } from './Bonus';
import { Synergy, SynergyMixReader, SynergyMixWriter } from './Synergy';
import { ITagInstanceData, TagInstance, TagInstanceMixReader, TagInstanceMixWriter } from './Tag';

export interface IDeployableData {
    name: string,
    type: string, // this is for UI furnishing only,
    detail: string,
    activation: ActivationType,
    deactivation?: ActivationType,
    recall?: ActivationType,
    redeploy?: ActivationType,
    size: number,
    cost?: number
    armor?: number,
    hp?: number,
    evasion?: number,
    edef?: number,
    heatcap?: number,
    repcap?: number,
    sensor_range?: number,
    tech_attack?: number,
    save?: number,
    speed?: number,
    actions?: IActionData[],
    bonuses?: IBonusData[],
    synergies?: ISynergyData[],
    counters?: ICounterData[],
    tags?: ITagInstanceData[],
}

export interface Deployable extends MixLinks<IDeployableData> {
    Name: string,
    Type: string, // this is for UI furnishing only,
    Detail: string,
    Activation: ActivationType,
    Deactivation: ActivationType,
    Recall: ActivationType,
    Redeploy: ActivationType,
    Size: number,
    Cost: number
    Armor: number,
    HP: number | null,
    Evasion: number | null,
    EDef: number | null,
    HeatCap: number | null,
    RepairCap: number | null,
    SensorRange: number | null,
    TechAttack: number | null,
    Save: number | null,
    Speed: number | null,
    Actions: Action[],
    Bonuses: Bonus[],
    Synergies: Synergy[],
    Counters: Counter[],
    Tags: TagInstance[],
}

// function ident<T>(v: T): T {return v;}

export function CreateDeployable(data: IDeployableData | null): Deployable {
    let b = new MixBuilder<Deployable, IDeployableData>({});
    b.with(new Mixlet("Name", "name", "New Deployable", ident, ident));
    b.with(new Mixlet("Type", "type", "custom", ident, ident));
    b.with(new Mixlet("Detail", "detail", "No description", ident, ident));
    b.with(new Mixlet("Activation", "activation", ActivationType.None, ident, ident));
    b.with(new Mixlet("Deactivation", "deactivation", ActivationType.None, ident, ident));
    b.with(new Mixlet("Recall", "recall", ActivationType.None, ident, ident));
    b.with(new Mixlet("Redeploy", "redeploy", ActivationType.None, ident, ident));
    b.with(new Mixlet("Size", "size", .5, ident, ident)); // deployables tend to be smaller
    b.with(new Mixlet("Cost", "cost", 1, ident, ident)); // No idea what this is - maybe charge usage (like for walking armory type systems)
    b.with(new Mixlet("Armor", "armor", 0, ident, ident)); 
    b.with(new Mixlet("HP", "hp", null, ident, ident_drop_null)); 
    b.with(new Mixlet("Evasion", "hp", null, ident, ident_drop_null)); 
    b.with(new Mixlet("EDef", "edef", null, ident, ident_drop_null)); 
    b.with(new Mixlet("HeatCap", "heatcap", null, ident, ident_drop_null)); 
    b.with(new Mixlet("RepairCap", "repcap", null, ident, ident_drop_null)); 
    b.with(new Mixlet("SensorRange", "sensor_range", null, ident, ident_drop_null)); 
    b.with(new Mixlet("TechAttack", "tech_attack", null, ident, ident_drop_null)); 
    b.with(new Mixlet("Save", "save", null, ident, ident_drop_null)); 
    b.with(new Mixlet("Speed", "speed", null, ident, ident_drop_null)); 
    b.with(new Mixlet("Actions", "actions", [], ActionsMixReader, ActionsMixWriter)); 
    b.with(new Mixlet("Bonuses", "bonuses", [], BonusesMixReader, BonusesMixWriter)); 
    b.with(new Mixlet("Synergies", "synergies", [], SynergyMixReader, SynergyMixWriter)); 
    b.with(new Mixlet("Counters", "counters", [], CountersMixReader, CountersMixWriter)); 
    b.with(new Mixlet("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter)); 
    

    let r = b.finalize(data);
    return r;
}

// function Deploy(this: Deployable, owner?: string, index?: string) {
    // if(index === undefined) {
        // index = "" + (++this.name_ctr);
    // }

    // this.BaseName = `${owner ? `${owner}'s ` : ""}${data.name}${n ? ` (#${n})` : ""}`;
// }


export interface IDeployedData {
    id: string;
    assigned_name: string;
    current_hp: number;
    current_duration?: number;
    overshield?: number;
    isDestroyed?: boolean;
}

export interface Deployed extends MixLinks<IDeployedData> {
    // Data
    ID: string; // UID of this instance. Used to differentiate items in a scene
    InstanceName: string;
    CurrentHP: number;
    CurrentDuration: number | null; // Null indicates infinite
    Overshield: number;
    Destroyed: boolean;

    // Methods
    // Apply damage, first to overshields, then to hp
    InflictDamage(amt: number): void;
}

// Create our deployable. Note that this doesn't object does not have any self-concept/knowledge of where it came from. It must be tracked properly with/by its corresponding deploybable
export function CreateDeployed(data: IDeployedData | null): Deployed {
    let mb = new MixBuilder<Deployed, IDeployedData>({InflictDamage});
    mb.with(new Mixlet("ID", "id", uuid(), ident, ident));
    mb.with(new Mixlet("InstanceName", "assigned_name", "Deployment #?", ident, ident));
    mb.with(new Mixlet("CurrentHP", "current_hp", 0, ident, ident));
    mb.with(new Mixlet("CurrentDuration", "current_duration", null, ident, ident_drop_null));
    mb.with(new Mixlet("Overshield", "overshield", 0, ident, ident));
    mb.with(new Mixlet("Destroyed", "isDestroyed", false, ident, ident));

    return mb.finalize(data);
}

function InflictDamage(this: Deployed, amt: number) {
    // If OS can tank, do it.
    if(amt <= this.Overshield) {
        this.Overshield -= amt;
    } 

    // Otherwise, neutralize OS, and then apply remained to hp
    amt -= this.Overshield;
    this.Overshield = 0;
    this.CurrentHP -= amt;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const DeployableMixReader = (x: IDeployableData[] | undefined) => (x || []).map(CreateDeployable);
export const DeployableMixWriter = (x: Deployable[]) => x.map(i => i.Serialize());