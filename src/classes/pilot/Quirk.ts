import { Action, Bonus, Deployable, Synergy, Counter } from "@/class";
import { IActionData, IBonusData, ISynergyData, RegCounterData } from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@/registry";

///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export interface RegQuirkData {
    name: string; // v-html
    description: string;
    actions?: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];

    // All associated content
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export class Quirk extends RegEntry<EntryType.QUIRK, RegQuirkData> {
    Name!: string;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any, any>[];

    protected async load(data: RegQuirkData): Promise<void> {
        this.ID = data.id;

        this.Name = data.name;

        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Deployables = await this.Registry.resolve_many(data.deployables);
        this.Integrated = await this.Registry.resolve_many_rough(data.integrated);
    }
    public async save(): Promise<RegQuirkData> {
        throw new Error("Method not implemented.");
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
}
