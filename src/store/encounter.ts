/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Encounter } from "@/class";
import { IEncounterData } from "@/classes/encounter/Encounter";
import { logger } from "@/hooks";
import { AbsStoreModule } from './store_module';

const ENCOUNTER_KEY = "ENCOUNTERS";

export class EncounterStore extends AbsStoreModule {
    private encounters: Encounter[] = [];

    // Retrieve current encounters
    public get Encounters(): Encounter[] {
        return this.encounters;
    }

    // Duplicate a loaded encounter
    public cloneEncounter(payload: Encounter): void {
        let nv = Encounter.Deserialize(Encounter.Serialize(payload));
        nv.Name = nv.Name + " (COPY)";
        nv.RenewID();
        this.addEncounter(nv);
    }

    // Add a new encounter
    public addEncounter(payload: Encounter): void {
        this.encounters.push(payload);
        this.saveData();
    }

    // Delete an existing encounter
    public deleteEncounter(payload: Encounter): void {
        let idx = this.encounters.findIndex(e => e.ID === payload.ID);
        if (idx > -1) {
            this.encounters.splice(idx);
            this.saveData();
        } else {
            logger(`No such encounter ${payload.Name}`);
        }
    }

    // Save all loaded encounters to persisten memory, overwriting previous data
    public async saveData(): Promise<void> {
        let raw = this.encounters.map(e => Encounter.Serialize(e));
        await this.persistence.set_item(ENCOUNTER_KEY, raw);
    }

    // Load all encounters from persistent storage
    public async loadData(): Promise<void> {
        let raw = (await this.persistence.get_item(ENCOUNTER_KEY)) || [] as IEncounterData[];
        this.encounters = raw.map(d => Encounter.Deserialize(d));
    }
}
