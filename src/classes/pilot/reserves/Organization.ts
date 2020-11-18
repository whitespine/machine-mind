import { OrgType } from "@src/enums";
import { bound_int } from "@src/funcs";
import { EntryType, RegEntry, SimSer } from "@src/registry";

export interface IOrganizationData {
    name: string;
    purpose: OrgType;
    description: string;
    efficiency: number;
    influence: number;
    actions: string;
}

export class Organization extends RegEntry<EntryType.ORGANIZATION> {
    public Purpose!: OrgType;
    public Name!: string;
    public Description!: string;
    private _efficiency!: number;
    private _influence!: number;
    public Actions!: string;

    // Get set to bound
    public get Efficiency(): number {
        return bound_int(this._efficiency, 1, 6);
    }

    public set Efficiency(n: number) {
        this._efficiency = bound_int(n, 1, 6);
    }

    // Get set to bound
    public get Influence(): number {
        return this._influence;
    }

    public set Influence(n: number) {
        this._influence = bound_int(n, 1, 6);
    }

    public async load(data: IOrganizationData): Promise<void> {
        this.Name = data.name;
        this.Purpose = data.purpose as OrgType;
        this.Efficiency = bound_int(data.efficiency, 0, 6);
        this.Influence = bound_int(data.influence, 0, 6);
        this.Description = data.description;
        this.Actions = data.actions;
    }
    public save(): IOrganizationData {
        return {
            name: this.Name,
            purpose: this.Purpose,
            description: this.Description,
            efficiency: this.Efficiency,
            influence: this.Influence,
            actions: this.Actions,
        };
    }
}
