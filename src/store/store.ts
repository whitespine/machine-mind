import {
    CompendiumStore,
    PilotManagementStore,
    NpcStore,
    EncounterStore,
    MissionStore,
} from "@/class";

export abstract class StoreInterface {
    // Our sub-parts
    abstract datastore: CompendiumStore;
    abstract pilots: PilotManagementStore;
    abstract npc: NpcStore;
    abstract encounter: EncounterStore;
    abstract mission: MissionStore;

    // This as well
    abstract getUserProfile(): any; // need to find a more elegant solution here
}
