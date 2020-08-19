import { PersistentStore } from "@/io/persistence";

// This is a bit complex but basically,
// this is a function A, which takes a function B, where
// B modifies its argument module to contain the newly loaded data
// A calls B at the appropriate time
export type load_setter<T> = (x: T) => void;
export type load_setter_handler<T> = (x: load_setter<T>) => void;

// Base of all derived store modules. Just contextualizes persistence
export abstract class AbsStoreModule {
    protected persistence: PersistentStore;

    constructor(persistence: PersistentStore, options: DataStoreOptions) {
        this.persistence = persistence;
    }

    // The on_load_callback should be how the compendium actually edits itself in async contexts
    public abstract loadData<T extends this>(handler: load_setter_handler<T>): Promise<void>;
    public abstract saveData(): Promise<void>;
}

export interface DataStoreOptions {
    disable_core_data: boolean;
}

export const DEFAULT_STORE_OPTIONS: DataStoreOptions = {
    disable_core_data: false,
};
