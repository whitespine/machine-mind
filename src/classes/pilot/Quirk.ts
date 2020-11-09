import { Action, Bonus, Deployable, Synergy, Counter } from "@src/class";
import { IActionData, IBonusData, ISynergyData, RegCounterData } from "@src/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";

///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export interface RegQuirkData {
    name: string; // v-html
    description: string;
    actions: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies: ISynergyData[];

    // All associated content
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export class Quirk extends RegEntry<EntryType.QUIRK, RegQuirkData> {
    Name!: string;
    Description!: string;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any, any>[];

    public async load(data: RegQuirkData): Promise<void> {
        this.Name = data.name;
        this.Description = data.description;

        SerUtil.load_commons(this.Registry, data, this);
        this.Integrated = await this.Registry.resolve_many_rough(data.integrated, this.OpCtx);
        this.Counters = SerUtil.process_counters(data.counters);
    }
    public async save(): Promise<RegQuirkData> {
        return {
            ...(await SerUtil.save_commons(this)),
            name: this.Name,
            description: this.Description,
            integrated: SerUtil.ref_all(this.Integrated),
            counters: SerUtil.sync_save_all(this.Counters),
        };
    }

    public static async unpack(raw_quirk: string, reg: Registry): Promise<Quirk> {
        let qdata: RegQuirkData = {
            name: "Quirk",
            description: raw_quirk,
            counters: [],
            deployables: [],
            integrated: [],
            actions: [],
            bonuses: [],
            synergies: [],
        };

        return reg.get_cat(EntryType.QUIRK).create(qdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
