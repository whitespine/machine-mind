import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry, SimSer } from "@src/registry";

interface AllSitrepData {
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

export interface PackedSitrepData extends AllSitrepData {
    id: string;
}

export interface RegSitrepData extends AllSitrepData {
    lid: string;
}

export class Sitrep extends RegEntry<EntryType.SITREP> {
    LID!: string;
    Name!: string;
    Description!: string;
    PcVictory!: string;
    EnemyVictory!: string;
    NoVictory!: string;
    Deployment!: string;
    Objective!: string;
    ControlZone!: string;
    Extraction!: string;

    protected save_imp(): RegSitrepData {
        return {
            lid: this.LID,
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

    public async load(data: RegSitrepData) {
        data = { ...defaults.SITREP(), ...data };
        this.LID = data.lid;
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

    public static async unpack(psd: PackedSitrepData, reg: Registry, ctx: OpCtx): Promise<Sitrep> {
        return reg.get_cat(EntryType.SITREP).create_live(ctx, {
            ...psd,
            lid: psd.id,
        });
    }
}
