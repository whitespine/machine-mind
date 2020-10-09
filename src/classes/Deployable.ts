import { Counter } from '@/class';
import { IActionData, IBonusData, ISynergyData, ICounterData } from '@/interface';
import { MixBuilder, RWMix, MixLinks, ident, CountersMixReader, ident_drop_null, uuid, defs, restrict_enum, restrict_choices, defn, defn_null, ser_many, ident_strict, def_empty_map } from '@/mixmeta';
import { Action, ActionsMixReader,  } from './Action';
import { Bonus, BonusesMixReader,  } from './Bonus';
import { ActivationType } from './enums';
import { EntryType, Registry, VRegistryItem } from './registry';
import { Synergy, SynergyMixReader,  } from './Synergy';
import { ITagInstanceData, TagInstance, TagInstanceMixReader,  } from './Tag';

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

export interface Deployable extends VRegistryItem<IDeployableData>{
    Name: string,
    Type: EntryType.DEPLOYABLE,
    DeployableType: string, // this is for UI furnishing only. Drone, etc
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

export async function CreateDeployable(data: IDeployableData | null, ctx: Registry): Promise<Deployable> {
    let b = new MixBuilder<Deployable, IDeployableData>({
        Type: EntryType.DEPLOYABLE
    });
    b.with(new RWMix("Name", "name", defs("New Deployable"), ident));
    b.with(new RWMix("DeployableType", "type", defs("Drone"), ident));
    b.with(new RWMix("Detail", "detail", defs("Detailed description"), ident));
    b.with(new RWMix("Activation", "activation", restrict_enum(ActivationType, ActivationType.Quick), ident));
    b.with(new RWMix("Deactivation", "deactivation", restrict_enum(ActivationType, ActivationType.Quick), ident));
    b.with(new RWMix("Recall", "recall", restrict_enum(ActivationType, ActivationType.Quick), ident));
    b.with(new RWMix("Redeploy", "redeploy", restrict_enum(ActivationType, ActivationType.Quick), ident));
    b.with(new RWMix("Size", "size", defn(.5), ident)); // deployables tend to be smaller
    b.with(new RWMix("Cost", "cost", defn(1), ident)); // No idea what this is - maybe charge usage (like for walking armory type systems)
    b.with(new RWMix("Armor", "armor", defn(0), ident)); 
    b.with(new RWMix("HP", "hp", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("Evasion", "hp", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("EDef", "edef", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("HeatCap", "heatcap", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("RepairCap", "repcap", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("SensorRange", "sensor_range", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("TechAttack", "tech_attack", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("Save", "save", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("Speed", "speed", defn_null(null), ident_drop_null)); 
    b.with(new RWMix("Actions", "actions", ActionsMixReader, ser_many)); 
    b.with(new RWMix("Bonuses", "bonuses", BonusesMixReader, ser_many)); 
    b.with(new RWMix("Synergies", "synergies", SynergyMixReader, ser_many)); 
    b.with(new RWMix("Counters", "counters", CountersMixReader, ser_many)); 
    b.with(new RWMix("Tags", "tags", TagInstanceMixReader, ser_many)); 
    
    return b.finalize(data, ctx);
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
// TODO: Rethink this in context of registries
export async function CreateDeployed(data: IDeployedData | null, ctx: Registry): Promise<Deployed> {
    let mb = new MixBuilder<Deployed, IDeployedData>({InflictDamage});
    mb.with(new RWMix("ID", "id", ident_strict, ident));
    mb.with(new RWMix("InstanceName", "assigned_name",ident_strict, ident));
    mb.with(new RWMix("CurrentHP", "current_hp", ident_strict, ident));
    mb.with(new RWMix("CurrentDuration", "current_duration", ident_strict, ident_drop_null));
    mb.with(new RWMix("Overshield", "overshield", ident_strict, ident));
    mb.with(new RWMix("Destroyed", "isDestroyed", ident_strict, ident));

    return mb.finalize(data, ctx);
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
// export const DeployableMixReader = def_empty_map(CreateDeployable);
// export const DeployedMixReader = def_empty_map(CreateDeployed);