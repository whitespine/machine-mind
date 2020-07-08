/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Encounter } from "@/class";

export abstract class EncounterStore {
    // Get currently loaded encounters
    abstract getEncounters(): Encounter[];

    // Save all loaded encounters to persisten memory, overwriting previous data
    abstract saveEncounterData(): Promise<void>;

    // Duplicate a loaded encounter
    abstract cloneEncounter(payload: Encounter): void;

    // Add a new encounter
    abstract addEncounter(payload: Encounter): void;

    // Delete an existing encounter
    abstract deleteEncounter(payload: Encounter): void;

    // Load all encounters from persistent storage
    abstract loadEncounters(): Promise<void>;
}
