import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";

export interface IStatusData {
    name: string;
    type: "Status" | "Condition";
    icon: string;
    effects: string[];
}

export class Status extends RegEntry<EntryType.STATUS> {
    public Name!: string;
    public Icon!: string;
    public Effects!: string[];
    public Subtype!: "Status" | "Condition";

    async load(data: IStatusData) {
        data = { ...defaults.STATUS(), ...data };
        this.Subtype = data.type;
        this.Name = data.name;
        this.Icon = data.icon;
        this.Effects = data.effects;
    }

    public save(): IStatusData {
        return {
            name: this.Name,
            icon: this.Icon,
            type: this.Subtype,
            effects: this.Effects,
        };
    }

    public static async unpack(dep: IStatusData, reg: Registry, ctx: OpCtx): Promise<Status> {
        return reg.get_cat(EntryType.STATUS).create_live(ctx, dep);
    }

    public get is_status(): boolean {
        return this.Subtype == "Status";
    }

    public get is_condition(): boolean {
        return this.Subtype == "Condition";
    }
}
