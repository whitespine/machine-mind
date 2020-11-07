import { EntryType, RegEntry, Registry, SimSer } from "@/registry";

export interface ISitrepData {
    id: string;
    name: string;
    description: string;
    pcVictory: string;
    enemyVictory: string;
    noVictory?: string;
    deployment?: string;
    objective?: string;
    controlZone?: string;
    extraction?: string;
}

export class Sitrep extends RegEntry<EntryType.SITREP, ISitrepData> {
    ID!: string;
    Name!: string;
    Description!: string;
    PcVictory!: string;
    EnemyVictory!: string;
    NoVictory!: string;
    Deployment!: string;
    Objective!: string;
    ControlZone!: string;
    Extraction!: string;

    public async save(): Promise<ISitrepData> {
        return {
            id: this.ID,
            name: this.Name,
            description: this.Description,
            pcVictory: this.PcVictory,
            enemyVictory: this.EnemyVictory,
            noVictory: this.NoVictory,
            deployment: this.Deployment,
            objective: this.Objective,
            controlZone: this.ControlZone,
            extraction: this.Extraction,
        };
    }

    protected async load(data: ISitrepData) {
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.PcVictory = data.pcVictory;
        this.EnemyVictory = data.enemyVictory;
        this.NoVictory = data.noVictory || "";
        this.Deployment = data.deployment || "";
        this.Objective = data.objective || "";
        this.ControlZone = data.controlZone || "";
        this.Extraction = data.extraction || "";
    }

   public static async unpack(dep: ISitrepData, reg: Registry): Promise<Sitrep> {
        return reg.get_cat(EntryType.SITREP).create(dep);
    }
}
