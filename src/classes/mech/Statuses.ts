import { defaults, lid_format_name } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";
import { merge_defaults } from "../default_entries";

interface AllStatusData {
    name: string;
    icon: string;
    terse?: string;
}

export interface PackedStatusData extends AllStatusData {
    effects: string | string[];
    type: "Status" | "Condition";
}

export interface RegStatusData extends Required<AllStatusData> {
    lid: string;
    effects: string;
    type: "Status" | "Condition" | "Other";
}

export class Status extends RegEntry<EntryType.STATUS> {
    public LID!: string;
    public Name!: string;
    public Icon!: string;
    public Effects!: string;
    public Terse!: string;
    public Subtype!: "Status" | "Condition" | "Other";

    async load(data: RegStatusData) {
        merge_defaults(data, defaults.STATUS());
        this.LID = data.lid;
        this.Subtype = data.type;
        this.Name = data.name;
        this.Icon = data.icon;
        this.Effects = data.effects;
        this.Terse = data.terse;
    }

    protected save_imp(): RegStatusData {
        return {
            lid: this.LID,
            name: this.Name,
            icon: this.Icon,
            type: this.Subtype,
            terse: this.Terse,
            effects: this.Effects,
        };
    }

    public static async unpack(psd: PackedStatusData, reg: Registry, ctx: OpCtx): Promise<Status> {
        let effects = psd.effects;
        if(Array.isArray(effects)) {
            effects = effects.join("\n");
        }
        return reg.get_cat(EntryType.STATUS).create_live(ctx, {
            effects,
            icon: psd.icon,
            name: psd.name,
            type: psd.type,
            terse: psd.terse ?? "",
            lid: "cond_" + lid_format_name(psd.name),
        });
    }

    public get is_status(): boolean {
        return this.Subtype == "Status";
    }

    public get is_condition(): boolean {
        return this.Subtype == "Condition";
    }

    public async emit(): Promise<PackedStatusData> {
        return {
            name: this.Name,
            effects: this.Effects,
            icon: this.Icon,
            type: this.Subtype != "Other" ? this.Subtype : "Condition",
        };
    }
}
