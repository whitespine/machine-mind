/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Mission, ActiveMission } from "@/class";

export abstract class MissionStore {
    // Accessors to current state
    abstract get Missions(): Mission[];
    abstract get ActiveMissions(): ActiveMission[];

    // Duplicate the given mission in the store.
    abstract cloneMission(payload: Mission): void;

    // Add a mission to the store
    abstract addMission(payload: Mission): void;

    // Add an active mission to the store
    abstract addActiveMission(payload: ActiveMission): void;

    // Delete the specified mission from the store
    abstract deleteMission(payload: Mission): void;

    // Delete the specified active mission from the store
    abstract deleteActiveMission(payload: ActiveMission): void;

    // Commit data to static storage, overwriting previous data
    abstract saveMissionData(): Promise<void>;
    abstract saveActiveMissionData(): Promise<void>;

    // Load missions from persistent storage
    abstract loadMissions(): Promise<void>;
    abstract loadActiveMissions(): Promise<void>;
}
