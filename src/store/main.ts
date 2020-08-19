import { CompendiumStore, FILEKEY_CONTENT_PACKS } from "./compendium";
import { PilotManagementStore, FILEKEY_PILOTS, FILEKEY_PILOT_GROUPS } from "./pilot";
import { NpcStore, FILEKEY_NPCS } from "./npc";
import { EncounterStore, FILEKEY_ENCOUNTERS } from "./encounter";
import { MissionStore, FILEKEY_ACTIVE_MISSIONS, FILEKEY_MISSIONS } from "./mission";
import { PersistentStore } from "@/io/persistence";
import { UserProfileStore, FILEKEY_USER, IUserProfile } from "./user_profile";
import { load_setter_handler, DataStoreOptions, DEFAULT_STORE_OPTIONS } from "./store_module";

type CCDataStoreMutation = load_setter_handler<CCDataStore>;
export { CCDataStoreMutation };

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

    constructor(persistence: PersistentStore, options?: DataStoreOptions) {
        // Supplant defaults
        options = {
            ...DEFAULT_STORE_OPTIONS, 
            ...(options || {})
        };
        this.compendium = new CompendiumStore(persistence, options);
        this.pilots = new PilotManagementStore(persistence, options);
        this.npcs = new NpcStore(persistence, options);
        this.encounters = new EncounterStore(persistence, options);
        this.missions = new MissionStore(persistence, options);
        this.user = new UserProfileStore(persistence, options);
    }

    // Call load on all modules
    public async load_all(handler: load_setter_handler<CCDataStore>): Promise<void> {
        // Black magicks - we're doing nested handlers, which is less than ideal, but trust the process.
        // Basically, we call loadData as we normally would, except our passed function must
        // use the parm _handler_ to route back to the corresponding module. Simple as that ;)

        // Handler can be any function that makes loading / setting data "safe". For instance, in a vue context this would possibly force edits to only occur when in a vuex context

        // Can do this wherever but better earlier
        this.user.loadData(h => handler(s => h(s.user))),
            // This one is most important for other data ones
            await this.compendium.loadData(h => handler(s => h(s.compendium)));

        // Then can do these, in this order (pilots  + npcs before missions/encounters
        await this.pilots.loadData(h => handler(s => h(s.pilots)));
        await this.npcs.loadData(h => handler(s => h(s.npcs)));

        await this.encounters.loadData(h => handler(s => h(s.encounters)));
        await this.missions.loadData(h => handler(s => h(s.missions)));
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
    IUserProfile,
};
