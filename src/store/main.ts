import { CompendiumStore } from "./compendium";
import { PilotManagementStore } from "./pilot";
import { NpcStore } from "./npc";
import { EncounterStore } from "./encounter";
import { MissionStore } from "./mission";
import { PersistentStore } from "@/io/persistence";
import { UserProfileStore } from './user_profile';

export class CCDataStore {
    // Substores
    compendium: CompendiumStore;
    pilots: PilotManagementStore;
    npcs: NpcStore;
    encounters: EncounterStore;
    missions: MissionStore;
    user: UserProfileStore;

    constructor(persistence: PersistentStore) {
        this.compendium = new CompendiumStore(persistence);
        this.pilots = new PilotManagementStore(persistence);
        this.npcs = new NpcStore(persistence);
        this.encounters = new EncounterStore(persistence);
        this.missions = new MissionStore(persistence);
        this.user = new UserProfileStore(persistence);
    }

    // Call void on all modules
    public async load_all(): Promise<void> {
        await Promise.all([
            this.compendium.loadData(),
            this.pilots.loadData(),
            this.npcs.loadData(),
            this.encounters.loadData(),
            this.missions.loadData()
        ]);
    }

    // Call save on all modules
    public async save_all(): Promise<void> {
        await Promise.all([
            this.compendium.saveData(),
            this.pilots.saveData(),
            this.npcs.saveData(),
            this.encounters.saveData(),
            this.missions.saveData()
        ]);
    }

    // We need this for cloud identificaation stuff
    get getUserID(): string {
        return this.user.ID;
    }

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
        this.lancerVer = lancerVer;
        this.ccVer = ccVer;
    }
}

export { CompendiumStore, PilotManagementStore, NpcStore, EncounterStore, MissionStore, UserProfileStore };
