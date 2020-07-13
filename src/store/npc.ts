/* eslint-disable @typescript-eslint/explicit-function-return-type */
import _ from "lodash";
import { Npc } from "@/class";
import { PersistentStore } from "@/io/persistence";
import { INpcData } from "@/classes/npc/Npc";
import { AbsStoreModule } from "./store_module";
import { logger } from "@/hooks";

const NPC_KEY = "npc_data";

export class NpcStore extends AbsStoreModule {
    private npcs: Npc[] = [];

    // Get a list of all currently loaded npcs
    public get Npcs(): Npc[] {
        return this.npcs;
    }

    // Get a specific loaded npc by id
    public getNpc(id: string): Npc | null {
        return this.npcs.find(n => n.ID == id) || null;
    }

    // Duplicate a loaded npc
    public cloneNpc(payload: Npc): void {
        const npcData = Npc.Serialize(payload);
        const newNpc = Npc.Deserialize(npcData);
        newNpc.RenewID();
        newNpc.Name += " (COPY)";
        this.npcs.push(newNpc);
        this.saveData();
    }

    // Add a new npc. New npc is added as a copy.
    public addNpc(payload: Npc): void {
        this.npcs.push();
        this.saveData();
    }

    // Delete an existing npc by ID
    public deleteNpc(npc: Npc): void {
        let idx = this.npcs.findIndex(n => n.ID === npc.ID);
        if (idx > -1) {
            this.npcs.splice(idx);
        } else {
            logger(`Could not remove npc ${npc.Name}`);
        }
        this.saveData();
    }

    // Check if a reload is necessary. This is helpful if there are multiple things that could be writing to the same data source file (e.g. multiple clients)
    // public abstract needsReload(): Promise<boolean>;

    // Load all npcs from persistent data
    // This is called automaticall before any changes are made, to make sure we don't clobber changes
    public async loadData(): Promise<void> {
        let inpc_data: INpcData[] = (await this.persistence.get_item(NPC_KEY) || []) as INpcData[];
        this.npcs = inpc_data.map(i => Npc.Deserialize(i));
    }

    // Save all loaded npcs to persistent data, overriding previous data
    // This is called after any of the above operations; deliberate invocation is only necessary after modifying an npc directly
    public async saveData(): Promise<void> {
        let inpc_data: INpcData[] = this.npcs.map(n => Npc.Serialize(n));
        await this.persistence.set_item(NPC_KEY, inpc_data);
    }
}
