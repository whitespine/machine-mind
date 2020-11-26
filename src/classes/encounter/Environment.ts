import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";
export interface IEnvironmentData {
    id: string;
    name: string;
    description: string; // v-html
}

// Seems overkill but whatever
export class Environment extends RegEntry<EntryType.ENVIRONMENT> {
    ID!: string;
    Name!: string;
    Description!: string;

    public async load(data: IEnvironmentData): Promise<void> {
        data = { ...defaults.ENVIRONMENT(), ...data };
        this.ID = data.id;
        this.Description = data.description;
        this.Name = data.name;
    }

    public save(): IEnvironmentData {
        return {
            description: this.Description,
            id: this.ID,
            name: this.Name,
        };
    }

    public static async unpack(
        dep: IEnvironmentData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Environment> {
        return reg.get_cat(EntryType.ENVIRONMENT).create_live(ctx, dep);
    }
}
