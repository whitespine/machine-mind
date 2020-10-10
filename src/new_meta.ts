import { EntryType, Registry } from '@/class';
import { IActionData } from './interface';

export abstract class SerUtil {
    public static deser_actions(actions: IActionData[] | undefined): Action[] {
        return (actions || []).map(a => CreateAction(a));
    }
}

// Simple serialization and deserialization
export abstract class SimSer<S> {
    // Setup
    constructor(data: S) {
        this.load(data);
    }

    // Populate this item with stuff
    protected abstract load(data: S): void;

    // Export this item for registry saving back to registry
    public abstract save(): S;
}

// We'll need to create a new entry
export const CREATE_ENTRY = Symbol("create");

// Serialization and deserialization requires a registry, but is not itself an entry.
export abstract class RegSer<T extends EntryType, S> {
    public readonly: T;
    registry: Registry;
    private _load_promise: Promise<any>;

    // Setup
    constructor(type: T, registry: Registry, data: S) {
        this.type = type;
        this.registry = registry;
        this._load_promise = this.load(data);
    }

    // Async ready check
    public async ready(): Promise<void> { await this._load_promise; }

    // Populate this item with stuff
    protected abstract async load(data: S): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<S>;
}

// Serialization and deserialization requires a registry
// Also, this item itself lives in the registry
export abstract class RegEntry<T extends EntryType, S> {
    public readonly type: T;
    registry: Registry;
    reg_id: string;

    // Setup
    constructor(type: T, registry: Registry, reg_id: string | typeof CREATE_ENTRY) {
        this.type = type;
        this.registry = registry;

        if(typeof id === "string") {

        } else {
            // Do as he says

        }
    }

    // Populate this item with stuff
    public abstract async load(data: S): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<S>;
}
