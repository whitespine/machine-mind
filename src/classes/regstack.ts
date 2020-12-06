import {
    EntryType,
    LiveEntryTypes,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
} from "@src/registry";

export interface RegFallback {
    base: Registry; // The registry we should check first, and insinuate any resolved data to
    fallbacks: Registry[]; // Checked in order
}


// Look in each registry in turn, returning the first that satisfies the reference
export async function finding_resolve_mmid<T extends EntryType>(from: RegFallback, ctx: OpCtx, cat: T, mmid: string): Promise<LiveEntryTypes<T> | null> {
    let d = await from.base.resolve_rough(ctx, quick_local_ref(from.base, cat, mmid));
    if (!d) {
        // Try all fallbacks
        for (let f of from.fallbacks) {
            d = await f.resolve_rough(ctx, quick_local_ref(f, cat, mmid)); 
            if (d) {
                break;
            }
        }
    }
    return d as LiveEntryTypes<T>;
}

// Look in each registry in turn, returning the first that satisfies the reference after insinuating it into the base
export async function gathering_resolve_mmid<T extends EntryType>(from: RegFallback, ctx: OpCtx, cat: T, mmid: string): Promise<LiveEntryTypes<T> | null> {
    let found = await finding_resolve_mmid(from, ctx, cat, mmid);
    if(found && found.Registry.name() != from.base.name()) {
        found = await found.insinuate(from.base, ctx) as LiveEntryTypes<T>;
    }
    return found;
}

// Look in each registry in turn, returning the first that satisfies the reference
export  async function finding_wildcard_mmid(from: RegFallback, ctx: OpCtx, mmid: string): Promise<RegEntry<any> | null> {
    let d = await from.base.resolve_wildcard_mmid(ctx, mmid);
    if (!d) {
        // Try all fallbacks
        for (let f of from.fallbacks) {
            d = await f.resolve_wildcard_mmid(ctx, mmid);
            if (d) {
                d = await d.insinuate(from.base, ctx);
                break;
            }
        }
    }
    return d;
}

// Look in each registry in turn, returning the first that satisfies the reference after insinuating it into the base
export async function gathering_wildcard_mmid(from: RegFallback, ctx: OpCtx, mmid: string): Promise<RegEntry<any> | null> {
    let found = await finding_wildcard_mmid(from, ctx, mmid);
    if(found && found.Registry != from.base) {
        found = await found.insinuate(from.base);
    }
    return found;
}

// Iterate from the fallback regs in sequence
export async function* finding_iterate<T extends EntryType>(from: RegFallback, ctx: OpCtx, cat: T): AsyncGenerator<LiveEntryTypes<T>, void, void> {
    // Yield from base
    let bv = await from.base.get_cat(cat).list_live(ctx);
    for(let v of bv) { yield v; }

    // Yield from downstream
    for(let fb of from.fallbacks) {
        bv = await fb.get_cat(cat).list_live(ctx);
        for(let v of bv) { yield v; }
    }
}