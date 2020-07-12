/* eslint-disable @typescript-eslint/explicit-function-return-type */
import _ from "lodash";
import { Pilot, PrintOptions } from "@/class";
import { IPilotData } from '@/classes/GeneralInterfaces';
import { PersistentStore } from '@/io/persistence';

const PilotKey = "PILOT_DATA";
const PilotGroupKey = "PILOT_GROUPS";

export abstract class PilotManagementStore {
    private pilots: Pilot[] = [];
    private active_pilot: Pilot | null = null;
    private pilot_groups: string[] = [];
    private loaded_mech_id = '';
    private persistence: PersistentStore;

    constructor(persistence: PersistentStore) {
        this.persistence = persistence;
    }

    // Return the list of pilots
    public get Pilots(): Pilot[] {
        return this.pilots;
    }

    // Returns the acttive pilot
    public get ActivePilot(): Pilot | null {
        return this.active_pilot;
    }

    // Return the list of pilot groups
    public get PilotGroups(): string[] {
        return this.pilot_groups;
    }

    // Return the active mech
    public get LoadedMechId(): string {
        return this.loaded_mech_id;
    }

    // Replace the current loaded pilot list with an entirely new one.
    public setPilots(payload: Pilot[]): void {
        this.pilots = payload;
        this.saveData();
    }

    // Duplicate a loaded pilot
    public clonePilot(pilot: Pilot): void {
        // To and from serialize, to be absolutely certain we aren't leaving any dangling data
        const pilotData = Pilot.Serialize(pilot);
        const newPilot = Pilot.Deserialize(pilotData);
        newPilot.RenewID();
        newPilot.Name += ' (CLONE)';
        newPilot.Callsign += '*';
        for (const mech of newPilot.Mechs) {
            mech.RenewID();
        }
        this.pilots.push(newPilot);
        this.saveData();
    }


    // Add a new pilot to the loaded data
    public addPilot(payload: Pilot): void {
        this.pilots.push(payload);
        this.saveData();
    }

    // Add a group with the provided name
    public addGroup(name: string): void {
        this.pilot_groups.push(name);
        this.saveData();
    }

    // Delete a loaded pilot
    public deletePilot(pilot: Pilot): void {
        const pilotIndex = this.Pilots.findIndex(x => x.ID === pilot.ID)
        if (pilotIndex > -1) {
            this.Pilots.splice(pilotIndex, 1);
            this.saveData();
        } else {
            throw console.error('Pilot not loaded!');
        }
    }

    // Delete the group with the provided name
    public deleteGroup(name: string): void {
        this.pilot_groups.splice(this.PilotGroups.indexOf(name), 1);
        this.saveData();
    }

    // Set the loaded mech to the provided id
    public setLoadedMech(id: string): void {
        this.loaded_mech_id = id;
    }

    // Save/load from persistent
    public async saveData() {
        const pilot_data = this.pilots.map(p => Pilot.Serialize(p));
        const pilot_groups = this.PilotGroups;
        await this.persistence.set_item(PilotKey, pilot_data);
        await this.persistence.set_item(PilotGroupKey, pilot_groups);
    }

    public async loadData(): Promise<void> {
        this.pilots = (await this.persistence.get_item(PilotKey)).map((p: IPilotData) => Pilot.Deserialize(p));
        this.pilot_groups = await this.persistence.get_item(PilotGroupKey);
    }
}
