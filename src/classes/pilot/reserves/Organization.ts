import { merge_defaults } from "@src/classes/default_entries";
import { OrgType } from "@src/enums";
import { bound, defaults } from "@src/funcs";
import { EntryType, RegEntry } from "@src/registry";

interface AllOrganizationData {
    name: string;
    purpose: OrgType;
    description: string;
    efficiency: number;
    influence: number;
    actions: string;
}
export interface PackedOrganizationData extends AllOrganizationData {}
export interface RegOrganizationData extends AllOrganizationData {
    lid: string;
}

export class Organization extends RegEntry<EntryType.ORGANIZATION> {
    public LID!: string;
    public Purpose!: OrgType;
    public Name!: string;
    public Description!: string;
    private _efficiency!: number;
    private _influence!: number;
    public Actions!: string;

    // Get set to bound
    public get Efficiency(): number {
        return bound(this._efficiency, 1, 6);
    }

    public set Efficiency(n: number) {
        this._efficiency = bound(n, 1, 6);
    }

    // Get set to bound
    public get Influence(): number {
        return this._influence;
    }

    public set Influence(n: number) {
        this._influence = bound(n, 1, 6);
    }

    public async load(data: RegOrganizationData): Promise<void> {
        merge_defaults(data, defaults.ORGANIZATION());
        this.LID = data.lid;
        this.Name = data.name;
        this.Purpose = data.purpose as OrgType;
        this.Efficiency = bound(data.efficiency, 0, 6);
        this.Influence = bound(data.influence, 0, 6);
        this.Description = data.description;
        this.Actions = data.actions;
    }
    protected save_imp(): RegOrganizationData {
        return {
            lid: this.LID,
            name: this.Name,
            purpose: this.Purpose,
            description: this.Description,
            efficiency: this.Efficiency,
            influence: this.Influence,
            actions: this.Actions,
        };
    }

    public async emit(): Promise<PackedOrganizationData> {
        return {
            name: this.Name,
            description: this.Description,
            efficiency: this.Efficiency,
            influence: this.Influence,
            purpose: this.Purpose,
            actions: this.Actions,
        };
    }
}
