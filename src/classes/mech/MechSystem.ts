import { Deployable, Synergy, Bonus, Action, TagInstance, Counter } from "@src/class";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegDeployableData,
    RegTagInstanceData,
} from "@src/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { SystemType } from "../enums";

interface AllMechSystemData {
    id: string;
    name: string;
    source: string; // must be the same as the Manufacturer ID to sort correctly
    license: string; // reference to the Frame name of the associated license
    license_level: number; // set to zero for this item to be available to a LL0 character
    type?: SystemType;
    sp: number;
    description: string; // v-html
    effect: string; // v-html
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
}

export interface PackedMechSystemData extends AllMechSystemData {
    deployables?: PackedDeployableData[];
    integrated?: string[];
    counters?: PackedCounterData[];
    tags?: PackedTagInstanceData[];
}

export interface RegMechSystemData extends AllMechSystemData {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    integrated: RegRef<any>[];
    counters: RegCounterData[];
    tags: RegTagInstanceData[];

    // We also save the active state
    cascading: boolean;
    destroyed: boolean;
}

export class MechSystem extends RegEntry<EntryType.MECH_SYSTEM, RegMechSystemData> {
    // System information
    ID!: string;
    Name!: string;
    Source!: string;
    SysType!: SystemType;
    License!: string;
    LicenseLevel!: number;
    SP!: number;
    Description!: string;
    Effect!: string;

    // Commonalities
    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Counters!: Counter[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any, any>[];

    // More system specific stuff
    Destroyed!: boolean;
    Cascading!: boolean;
    // Loaded!: boolean  // is this needed?

    public async load(data: RegMechSystemData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Source = data.source;
        this.SysType = data.type || SystemType.System;
        this.License = data.license;
        this.LicenseLevel = data.license_level;
        this.SP = data.sp;
        this.Description = data.description;
        this.Effect = data.effect;

        this.Cascading = data.cascading;
        this.Destroyed = data.destroyed;

        await SerUtil.load_commons(this.Registry, data, this);
        this.Tags = await SerUtil.process_tags(this.Registry, data.tags);
        this.Counters = data.counters?.map(c => new Counter(c)) || [];
        this.Integrated = await this.Registry.resolve_many(data.integrated);
    }

    public async save(): Promise<RegMechSystemData> {
        return {
            description: this.Description,
            effect: this.Effect,
            id: this.ID,
            name: this.Name,
            source: this.Source,
            license: this.License,
            license_level: this.LicenseLevel,
            sp: this.SP,
            type: this.SysType,

            cascading: this.Cascading,
            destroyed: this.Destroyed,

            tags: await SerUtil.save_all(this.Tags),
            counters: SerUtil.sync_save_all(this.Counters),
            integrated: SerUtil.ref_all(this.Integrated),
            ...(await SerUtil.save_commons(this)),
        };
    }

    public static async unpack(data: PackedMechSystemData, reg: Registry): Promise<MechSystem> {
        let rdata: RegMechSystemData = {
            ...data,
            ...(await SerUtil.unpack_commons_and_tags(data, reg)),
            integrated: SerUtil.unpack_integrated_refs(data.integrated),
            counters: SerUtil.unpack_counters_default(data.counters),
            cascading: false,
            destroyed: false,
        };

        return reg.get_cat(EntryType.MECH_SYSTEM).create(rdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
