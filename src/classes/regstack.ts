import {
    EntryType,
    LiveEntryTypes,
    RegCat,
    RegEntry,
    RegEntryTypes,
    Registry,
    RegRef,
} from "@/registry";

// Provides a mechanism for fallback regs
export class RegStack extends Registry {
    // An array of registries to look in, in-order.
    stack: Registry[];

    constructor(registry_stack: Registry[]) {
        super();
        this.stack = registry_stack;
    }

    async resolve_rough(ref: RegRef<EntryType>): Promise<RegEntry<any, any> | null> {
        for (let r of this.stack) {
            let found = await r.resolve_rough(ref);
            if (found) {
                return found;
            }
        }
        return null;
    }

    public async resolve_wildcard_mmid(mmid: string): Promise<RegEntry<any, any> | null> {
        for (let r of this.stack) {
            let found = await r.resolve_wildcard_mmid(mmid);
            if (found) {
                return found;
            }
        }
        return null;
    }

    public async get_inventory(for_item_id: string): Promise<Registry | null> {
        for (let r of this.stack) {
            let found = await r.get_inventory(for_item_id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    async delete(...args: any) {
        throw new Error("Cannot delete in regstack");
    }

    get_cat<T extends EntryType>(cat: T): RegCat<T> {
        // Get cats from children
        let cats = this.stack.map(r => r.get_cat(cat));
        // Make a temporary stack
        return new CatStack(this, cat, cats);
    }
}

export class CatStack<T extends EntryType> extends RegCat<T> {
    stack: RegCat<T>[];

    constructor(parent: Registry, cat: T, cat_stack: RegCat<T>[]) {
        super(parent, cat, () => {
            throw new Error(
                "Whatever you just tried to do? don't do that. Creating an item is undefined behavior on a CatStack"
            );
        });
        this.stack = cat_stack;
    }

    // Delegate to stack
    async lookup_mmid(mmid: string): Promise<LiveEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.lookup_mmid(mmid);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Delegate to stack
    async get_raw(id: string): Promise<RegEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.get_raw(id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Combine stack
    async list_raw(): Promise<RegEntryTypes<T>[]> {
        // Be aware thate this will have duplicate entries
        let result: RegEntryTypes<T>[] = [];
        for (let r of this.stack) {
            result.push(...(await r.list_raw()));
        }
        return result;
    }

    // Delegate to stack
    async get_live(id: string): Promise<LiveEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.get_live(id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Combine stack
    async list_live(): Promise<LiveEntryTypes<T>[]> {
        // Be aware thate this will have duplicate entries
        let result: LiveEntryTypes<T>[] = [];
        for (let r of this.stack) {
            result.push(...(await r.list_live()));
        }
        return result;
    }

    update(...items: LiveEntryTypes<T>[]): Promise<void> {
        throw new Error("Undefined behavior on CatStack");
    }
    delete_id(id: string): Promise<RegEntryTypes<T> | null> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_many(...vals: RegEntryTypes<T>[]): Promise<LiveEntryTypes<T>[]> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_default(): Promise<LiveEntryTypes<T>> {
        throw new Error("Undefined behavior on CatStack");
    }
}
