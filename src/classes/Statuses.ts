import { defaults, lid_format_name } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";
import { merge_defaults } from "./default_entries";

interface AllStatusData {
    name: string;
    type: "Status" | "Condition";
    icon: string;
    effects: string[];
}

export interface PackedStatusData extends AllStatusData {}

export interface RegStatusData extends AllStatusData {
    lid: string;
}

export class Status extends RegEntry<EntryType.STATUS> {
    public LID!: string;
    public Name!: string;
    public Icon!: string;
    public Effects!: string[];
    public Subtype!: "Status" | "Condition";

    async load(data: RegStatusData) {
        merge_defaults(data, defaults.STATUS());
        this.LID = data.lid;
        this.Subtype = data.type;
        this.Name = data.name;
        this.Icon = data.icon;
        this.Effects = data.effects;
    }

    protected save_imp(): RegStatusData {
        return {
            lid: this.LID,
            name: this.Name,
            icon: this.Icon,
            type: this.Subtype,
            effects: this.Effects,
        };
    }

    public static async unpack(psd: PackedStatusData, reg: Registry, ctx: OpCtx): Promise<Status> {
        return reg.get_cat(EntryType.STATUS).create_live(ctx, {
            effects: psd.effects,
            icon: psd.icon,
            name: psd.name,
            type: psd.type,
            lid: "cond_" + lid_format_name(psd.name),
        });
    }

    public get is_status(): boolean {
        return this.Subtype == "Status";
    }

    public get is_condition(): boolean {
        return this.Subtype == "Condition";
    }
}
