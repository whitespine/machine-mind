import { Action, Bonus, Deployable, Synergy, Counter } from "@src/class";
import { defaults } from "@src/funcs";
import { RegActionData, ISynergyData, RegBonusData, RegCounterData } from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { merge_defaults } from "../default_entries";

///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export interface RegQuirkData {
    lid: string;
    name: string; // v-html
    description: string;
    actions: RegActionData[]; // these are only available to UNMOUNTED pilots
    bonuses: RegBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies: ISynergyData[];

    // All associated content
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export class Quirk extends RegEntry<EntryType.QUIRK> {
    LID!: string;
    Name!: string;
    Description!: string;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Counters!: Counter[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any>[];

    public async load(data: RegQuirkData): Promise<void> {
        merge_defaults(data, defaults.QUIRK());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;

        SerUtil.load_basd(this.Registry, data, this, this.Name);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {
            wait_ctx_ready: false,
        });
        this.Counters = SerUtil.process_counters(data.counters);
    }
    protected save_imp(): RegQuirkData {
        return {
            ...SerUtil.save_commons(this),
            lid: this.LID,
            name: this.Name,
            description: this.Description,
            integrated: SerUtil.ref_all(this.Integrated),
            counters: SerUtil.save_all(this.Counters),
        };
    }

    public static async unpack(raw_quirk: string, reg: Registry, ctx: OpCtx): Promise<Quirk> {
        let qdata: RegQuirkData = merge_defaults(
            {
                name: `Quirk: ${raw_quirk
                    .split(" ")
                    .slice(0, 6)
                    .join(" ")}...`, // Show the first 6 words in the name
                description: raw_quirk,
            },
            defaults.QUIRK()
        );

        return reg.get_cat(EntryType.QUIRK).create_live(ctx, qdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public async emit(): Promise<string> {
        return this.Description;
    }
}
