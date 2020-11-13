/*
import {
    EntryType,
    LiveEntryTypes,
    OpCtx,
    RegCat,
    RegEntry,
    RegEntryTypes,
    Registry,
    RegRef,
} from "@src/registry";

// Provides a mechanism for fallback regs
export class RegStack extends Registry {
    // An array of registries to look in, in-order.
    stack: Registry[];

    constructor(registry_stack: Registry[]) {
        super();
        this.stack = registry_stack;
    }

    async resolve_rough(ctx: OpCtx, ref: RegRef<EntryType>): Promise<RegEntry<any> | null> {
        for (let r of this.stack) {
            let found = await r.resolve_rough(ctx, ref);
            if (found) {
                return found;
            }
        }
        return null;
    }

    public async resolve_wildcard_mmid(ctx: OpCtx, mmid: string): Promise<RegEntry<any> | null> {
        for (let r of this.stack) {
            let found = await r.resolve_wildcard_mmid(ctx, mmid);
            if (found) {
                return found;
            }
        }
        return null;
    }

    public get_inventory(for_item_id: string): Registry {
        throw new Error("Getting inventory of a regstack is undefined behavior");
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

    is(other: Registry) {
        return false;
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
    async lookup_mmid(ctx: OpCtx, mmid: string): Promise<LiveEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.lookup_mmid(ctx, mmid)
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
    async get_live(ctx: OpCtx, id: string): Promise<LiveEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.get_live( ctx, id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Combine stack
    async list_live(ctx: OpCtx): Promise<LiveEntryTypes<T>[]> {
        // Be aware thate this will have duplicate entries
        let result: LiveEntryTypes<T>[] = [];
        for (let r of this.stack) {
            result.push(...(await r.list_live(ctx)));
        }
        return result;
    }

    update(...items: LiveEntryTypes<T>[]): Promise<void> {
        throw new Error("Undefined behavior on CatStack");
    }
    delete_id(id: string): Promise<RegEntryTypes<T> | null> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_many(ctx: OpCtx, ...vals: RegEntryTypes<T>[]): Promise<LiveEntryTypes<T>[]> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_default(ctx: OpCtx): Promise<LiveEntryTypes<T>> {
        throw new Error("Undefined behavior on CatStack");
    }
}


// Provides a more agressive version of the regstack - this one will actively make copies of anything it cant immediately find
export class CovetousReg extends Registry {
    private fallback: Registry;
    private base: Registry; // We try to read from here. If we cannot, but find what we desire in fallback, we make a local copy and return that.

    constructor(base: Registry, fallback: Registry) {
        super();
        this.base = base;
        this.fallback = fallback;
    }

    async resolve_rough(ctx: OpCtx, ref: RegRef<EntryType>): Promise<RegEntry<any> | null> {
        let d = await this.base.resolve_rough(ctx, ref);
        if(!d) {
            d = await this.fallback.resolve_rough(ctx, ref);
            if(d) {
                d = await d.insinuate(this.base);
            }
        }
        return d;
    }

    public async resolve_wildcard_mmid(ctx: OpCtx, mmid: string): Promise<RegEntry<any> | null> {
        let d = await this.base.resolve_wildcard_mmid(ctx, mmid);
        if(!d) {
            d = await this.fallback.resolve_wildcard_mmid(ctx, mmid);
            if(d) {
                d = await d.insinuate(this.base);
            }
        }
        return d;
    }

    public get_inventory(for_item_id: string): Registry {
        throw new Error("Getting inventory of a regstack is undefined behavior");
    }

    async delete(...args: any) {
        throw new Error("Cannot delete in regstack");
    }

    get_cat<T extends EntryType>(cat: T): RegCat<T> {
        // Get our two
        let base = this.base.get_cat(cat);
        let fallback = this.fallback.get_cat(cat);

        // Make a temporary stack
        return new CovetousCatStack(this, cat, base, fallback);
    }

    is(other: Registry) {
        return false;
    }
}

export class CovetousCatStack<T extends EntryType> extends RegCat<T> {
    base: RegCat<T>;
    fallback: RegCat<T>;

    constructor(parent: Registry, cat: T, base: RegCat<T>, fallback: RegCat<T>) {
        super(parent, cat, () => {
            throw new Error(
                "Whatever you just tried to do? don't do that. Creating an item is undefined behavior on a CovetousCatStack"
            );
        });
        this.base = base;
        this.fallback = fallback;
    }

    // Delegate to stack
    async lookup_mmid(ctx: OpCtx, mmid: string): Promise<LiveEntryTypes<T> | null> {
        let d = await this.base.lookup_mmid(ctx, mmid);
        if(!d) {
            d = await this.fallback.lookup_mmid(ctx, mmid);
            if(d) {
                d = await d.insinuate(this.base.parent) as LiveEntryTypes<T> | null;
            }
        }
        return d;
    }

    // Delegate to stack
    async get_raw(id: string): Promise<RegEntryTypes<T> | null> {
        let d = await this.base.ge(ctx, mmid);
        if(!d) {
            d = await this.fallback.lookup_mmid(ctx, mmid);
            if(d) {
                d = await d.insinuate(this.base.parent) as LiveEntryTypes<T> | null;
            }
        }
        return d;
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
    async get_live(ctx: OpCtx, id: string): Promise<LiveEntryTypes<T> | null> {
        for (let r of this.stack) {
            let found = await r.get_live( ctx, id);
            if (found) {
                return found;
            }
        }
        return null;
    }

    // Combine stack
    async list_live(ctx: OpCtx): Promise<LiveEntryTypes<T>[]> {
        // Be aware thate this will have duplicate entries
        let result: LiveEntryTypes<T>[] = [];
        for (let r of this.stack) {
            result.push(...(await r.list_live(ctx)));
        }
        return result;
    }

    update(...items: LiveEntryTypes<T>[]): Promise<void> {
        throw new Error("Undefined behavior on CatStack");
    }
    delete_id(id: string): Promise<RegEntryTypes<T> | null> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_many(ctx: OpCtx, ...vals: RegEntryTypes<T>[]): Promise<LiveEntryTypes<T>[]> {
        throw new Error("Undefined behavior on CatStack");
    }
    create_default(ctx: OpCtx): Promise<LiveEntryTypes<T>> {
        throw new Error("Undefined behavior on CatStack");
    }
}
*/