import { PersistentStore } from "@/io/persistence";

// Base of all derived store modules. Just contextualizes persistence
export abstract class AbsStoreModule {
    protected persistence: PersistentStore;

    constructor(persistence: PersistentStore) {
        this.persistence = persistence;
    }
}
