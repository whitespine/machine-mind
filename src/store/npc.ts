/* eslint-disable @typescript-eslint/explicit-function-return-type */
import _ from "lodash";
import { Npc } from "@/class";

export abstract class NpcStore {
    // Get a list of all currently loaded npcs
    abstract getNpcs(): Npc[];

    // Get a specific loaded npc by id
    abstract getNpc(id: string): Npc | null;

    // Save all loaded npcs to persistent data, overriding previous data
    abstract saveNpcData(): Promise<void>;

    // Duplicate a loaded npc
    abstract cloneNpc(payload: Npc): void;

    // Add a new npc
    abstract addNpc(payload: Npc): void;

    // Delete an existing npc
    abstract deleteNpc(payload: Npc): void;

    // Load all npcs from persistent data
    abstract loadNpcs(): Promise<void>;
}
