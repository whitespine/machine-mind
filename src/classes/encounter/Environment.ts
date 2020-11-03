import { EntryType, RegEntry } from "@/registry";
export interface IEnvironmentData {
    id: string;
    name: string;
    description: string; // v-html
}

// Seems overkill but whatever
export class Environment extends RegEntry<EntryType.ENVIRONMENT, IEnvironmentData> {
    ID!: string;
    Name!: string;
    Description!: string;

    protected async load(data: IEnvironmentData): Promise<void> {
        this.ID = data.id;
        this.Description = data.description;
        this.Name = data.name;
    }

    public async save(): Promise<IEnvironmentData> {
        return {
            description: this.Description,
            id: this.ID,
            name: this.Name,
        };
    }
}
