/* eslint-disable @typescript-eslint/explicit-function-return-type */
import _ from "lodash";
import { Pilot, PrintOptions } from "@/class";

export abstract class PilotManagementStore {
    // Return the list of pilots
    public abstract get Pilots(): Pilot[];

    // Returns the acttive pilot
    public abstract get ActivePilot(): Pilot;

    // Return the list of pilot groups
    public abstract get PilotGroups(): string[];

    // Return the active mech
    public abstract get LoadedMechId(): string;

    // Replace the current loaded pilot list with an entirely new one.
    public abstract setPilots(payload: Pilot[]): void;

    // Duplicate a loaded pilot
    public abstract clonePilot(payload: Pilot): void;

    // Add a new pilot to the loaded data
    public abstract addPilot(payload: Pilot): void;

    // Add a group with the provided name
    public abstract addGroup(name: string): void;

    // Delete a loaded pilot
    public abstract deletePilot(pilot: Pilot): void;

    // Delete the group with the provided name
    public abstract deleteGroup(name: string): void;

    // Set the loaded mech to the provided id
    public abstract setLoadedMech(id: string): void;

    // Save/load from persistent
    public abstract async savePilots(): Promise<void>;
    public abstract async loadPilots(): Promise<void>;
}
