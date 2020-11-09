/* eslint-disable @typescript-eslint/explicit-function-return-type */
import _ from "lodash";
import { Npc } from "@src/class";
import { PersistentStore } from "@src/io/persistence";
import { INpcData } from "@src/classes/npc/Npc";
import { AbsStoreModule, load_setter_handler } from "./store_module";
import { logger } from "@src/hooks";

export const FILEKEY_NPCS = "npcs_v2.json";

export class NpcStore extends AbsStoreModule {
    private _npcs: Npc[] = [];

    // Get a list of all currently loaded npcs
    public get Npcs(): Npc[] {
        return this._npcs;
    }

    // Get a specific loaded npc by id
    public getNpc(id: string): Npc | null {
        return this._npcs.find(n => n.ID == id) || null;
    }

    // Duplicate a loaded npc
    public cloneNpc(payload: Npc): void {
        const npcData = Npc.Serialize(payload);
        const newNpc = Npc.Deserialize(npcData);
        newNpc.RenewID();
        newNpc.Name += " (COPY)";
        this._npcs.push(newNpc);
        this.saveData();
    }

    // Add a new npc. New npc is added as a copy.
    public addNpc(payload: Npc): void {
        this._npcs.push();
        this.saveData();
    }

    // Replace by id
    public updateNpc(new_npc: Npc): void {
        let idx = this._npcs.findIndex(e => e.ID === new_npc.ID);
        if (idx > -1) {
            this._npcs.splice(idx, 1, new_npc);
            this.saveData();
        } else {
            logger(`Tried to update npc ${new_npc.ID}, but it did not exist!`);
        }
    }

    // Delete an existing npc by ID
    public deleteNpc(npc: Npc): void {
        let idx = this._npcs.findIndex(n => n.ID === npc.ID);
        if (idx > -1) {
            this._npcs.splice(idx);
        } else {
            logger(`Could not remove npc ${npc.Name}`);
        }
        this.saveData();
    }

    // Check if a reload is necessary. This is helpful if there are multiple things that could be writing to the same data source file (e.g. multiple clients)
    // public abstract needsReload(): Promise<boolean>;

    // Load all npcs from persistent data
    // This is called automaticall before any changes are made, to make sure we don't clobber changes
    public async loadData(handler: load_setter_handler<NpcStore>): Promise<void> {
        let inpc_data = (await this.persistence.get_item<INpcData[]>(FILEKEY_NPCS)) || [];
        let npcs = inpc_data.map(i => Npc.Deserialize(i));

        handler(x => (x._npcs = npcs));
    }

    // Save all loaded npcs to persistent data, overriding previous data
    // This is called after any of the above operations; deliberate invocation is only necessary after modifying an npc directly
    public async saveData(): Promise<void> {
        let inpc_data: INpcData[] = this._npcs.map(n => Npc.Serialize(n));
        await this.persistence.set_item(FILEKEY_NPCS, inpc_data);
    }
}
