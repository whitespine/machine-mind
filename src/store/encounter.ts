/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Encounter } from "@/class";

export abstract class EncounterStore {
    private encounters: Encounter[] = [];

    // Retrieve current encounters
    public getEncounters(): Encounter[] {
        return this.encounters;
    }

    // Duplicate a loaded encounter
    abstract cloneEncounter(payload: Encounter): void;

    // Add a new encounter
    abstract addEncounter(payload: Encounter): void;

    // Delete an existing encounter
    abstract deleteEncounter(payload: Encounter): void;

    // Save all loaded encounters to persisten memory, overwriting previous data
    abstract saveEncounterData(): Promise<void>;

    // Load all encounters from persistent storage
    abstract loadEncounters(): Promise<void>;
}
