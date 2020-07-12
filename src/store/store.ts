import { CompendiumStore } from "./compendium";
import { PilotManagementStore } from "./pilot";
import { NpcStore } from "./npc";
import { EncounterStore } from "./encounter";
import { MissionStore } from "./mission";
import { PersistentStore } from "@/io/persistence";

export abstract class Store {
    // Substores
    compendium: CompendiumStore;
    pilots: PilotManagementStore;
    npc: NpcStore;
    encounter: EncounterStore;
    mission: MissionStore;

    constructor(persistence: PersistentStore) {
        this.compendium = new CompendiumStore(persistence);
        this.pilots = new PilotManagementStore(persistence);
        this.npc = new NpcStore(persistence);
        this.encounter = new EncounterStore(persistence);
        this.mission = new MissionStore(persistence);
    }

    // Call void on all modules
    public load_all(): void {
        this.compendium.loadData().then(() => this.compendium.populate());
        this.pilots.loadData();
        this.npc.loadData();
        this.encounter.loadData();
        this.mission.loadData();
    }

    // Call save on all modules
    public save_all(): void {
        this.compendium.saveData();
        this.pilots.saveData();
        this.npc.saveData();
        this.encounter.saveData();
        this.mission.saveData();
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
