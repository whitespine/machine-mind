import { CompendiumStore } from "./compendium";
import { PilotManagementStore } from "./pilot";
import { NpcStore } from "./npc";
import { EncounterStore } from "./encounter";
import { MissionStore } from "./mission";
import { PersistentStore } from "@/io/persistence";

// Base of all derived store modules. Just contextualizes persistence
export abstract class AbsStoreModule {
    protected persistence: PersistentStore;

    constructor(persistence: PersistentStore) {
        this.persistence = persistence;
    }
}

export abstract class Store {
    // Substores
    datastore: CompendiumStore;
    pilots: PilotManagementStore;
    npc: NpcStore;
    encounter: EncounterStore;
    mission: MissionStore;

    constructor(persistence: PersistentStore) {
        this.datastore = new CompendiumStore(persistence);
        this.pilots = new PilotManagementStore(persistence);
        this.npc = new NpcStore(persistence);
        this.encounter = new EncounterStore(persistence);
        this.mission = new MissionStore(persistence);
    }

    // We need this for cloud identificaation stuff
    abstract getUserID(): string;

    // Version information
    private lancerVer = "V?.?.?";
    private ccVer = "V?.?.?";

    // Get the current version
    get getVersion(): string {
        return this.ccVer;
    }

    get getLancerVersion(): string {
        return this.lancerVer;
    }

    // Set the current version to display
    setVersions(lancerVer: string, ccVer: string): void {
        (this.lancerVer = lancerVer), (this.ccVer = ccVer);
    }
}

export { CompendiumStore, PilotManagementStore, NpcStore, EncounterStore, MissionStore };
