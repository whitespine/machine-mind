import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";
import { merge_defaults } from "../default_entries";
export interface PackedEnvironmentData {
    id: string;
    name: string;
    description: string; // v-html
}

export interface RegEnvironmentData {
    lid: string;
    name: string;
    description: string; // v-html
}

// Seems overkill but whatever
export class Environment extends RegEntry<EntryType.ENVIRONMENT> {
    LID!: string;
    Name!: string;
    Description!: string;

    public async load(data: RegEnvironmentData): Promise<void> {
        merge_defaults(data, defaults.ENVIRONMENT());
        this.LID = data.lid;
        this.Description = data.description;
        this.Name = data.name;
    }

    protected save_imp(): RegEnvironmentData {
        return {
            description: this.Description,
            lid: this.LID,
            name: this.Name,
        };
    }

    public static async unpack(
        ped: PackedEnvironmentData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Environment> {
        return reg.get_cat(EntryType.ENVIRONMENT).create_live(ctx, {
            lid: ped.id,
            name: ped.name,
            description: ped.description,
        });
    }

    public async emit(): Promise<PackedEnvironmentData> {
        return {
            description: this.Description,
            id: this.LID,
            name: this.Name,
        };
    }
}
