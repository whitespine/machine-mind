import { EntryType, RegEntry } from "@/registry";

export interface IStatusData {
    name: string;
    type: "Status" | "Condition";
    icon: string;
    effects: string[];
}

export class Status extends RegEntry<EntryType.STATUS, IStatusData> {
    public Name!: string;
    public Icon!: string;
    public Effects!: string[];
    public Subtype!: "Status" | "Condition";

    async load(data: IStatusData) {
        this.Subtype = data.type;
        this.Name = data.name;
        this.Icon = data.icon;
        this.Effects = data.effects;
    }

    async save() {
        return {
            name: this.Name,
            icon: this.Icon,
            type: this.Subtype,
            effects: this.Effects,
        };
    }

    public get is_status(): boolean {
        return this.Subtype == "Status";
    }

    public get is_condition(): boolean {
        return this.Subtype == "Condition";
    }
}
