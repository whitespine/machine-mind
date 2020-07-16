import { CompendiumStore, FILEKEY_CONTENT_PACKS } from "./compendium";
import { PilotManagementStore, FILEKEY_PILOTS, FILEKEY_PILOT_GROUPS } from "./pilot";
import { NpcStore, FILEKEY_NPCS } from "./npc";
import { EncounterStore, FILEKEY_ENCOUNTERS } from "./encounter";
import { MissionStore, FILEKEY_ACTIVE_MISSIONS, FILEKEY_MISSIONS } from "./mission";
import { PersistentStore } from "@/io/persistence";
import { UserProfileStore, FILEKEY_USER } from "./user_profile";

export const FILE_KEYS = {
    active_missions: FILEKEY_ACTIVE_MISSIONS,
    content_packs: FILEKEY_CONTENT_PACKS,
    encounters: FILEKEY_ENCOUNTERS,
    missions: FILEKEY_MISSIONS,
    npcs: FILEKEY_NPCS,
    pilot_groups: FILEKEY_PILOT_GROUPS,
    pilots: FILEKEY_PILOTS,
    user_config: FILEKEY_USER,
};

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
            this.missions.loadData(),
        ]);
    }

    // Call save on all modules
    public async save_all(): Promise<void> {
        await Promise.all([
            this.compendium.saveData(),
            this.pilots.saveData(),
            this.npcs.saveData(),
            this.encounters.saveData(),
            this.missions.saveData(),
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

export {
    CompendiumStore,
    PilotManagementStore,
    NpcStore,
    EncounterStore,
    MissionStore,
    UserProfileStore,
};
