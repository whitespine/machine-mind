import { CompendiumStore } from "./compendium";
import { PilotManagementStore } from "./pilot";
import { NpcStore } from "./npc";
import { EncounterStore } from "./encounter";
import { MissionStore } from "./mission";

export abstract class Store {
    // Substores
    abstract datastore: CompendiumStore;
    abstract pilots: PilotManagementStore;
    abstract npc: NpcStore;
    abstract encounter: EncounterStore;
    abstract mission: MissionStore;

    // This as well
    abstract getUserProfile(): any;

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
