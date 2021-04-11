import {
    EntryType,
    InsinuateHooks,
    LiveEntryTypes,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
} from "@src/registry";

// Represents a "target" registry and a set of registries that will be used as backup data sources, in order
export interface RegFallback {
    base: Registry; // The registry we should check first, and insinuate any resolved data to
    fallbacks: Registry[]; // Checked in order
}

// Look in each registry in turn, returning the first that satisfies the reference.
// Ignored the registry name specified on the ref
export async function fallback_resolve_ref<T extends EntryType>(
    from: RegFallback,
    ctx: OpCtx,
    ref: Omit<RegRef<T>, "reg_name">
): Promise<LiveEntryTypes<T> | null> {
    let rcp: RegRef<T> = { ...ref, reg_name: from.base.name() };
    let d = await from.base.resolve_rough(ctx, rcp);
    if (!d) {
        // Try all fallbacks
        for (let f of from.fallbacks) {
            rcp.reg_name = f.name();
            d = await f.resolve_rough(ctx, rcp);
            if (d) {
                break;
            }
        }
    }
    return d as LiveEntryTypes<T>;
}

// Look in each registry in turn, returning the first that satisfies the reference after insinuating it into the base
// Ignored the registry name specified on the ref
export async function fallback_obtain_ref<T extends EntryType>(
    from: RegFallback,
    ctx: OpCtx,
    ref: Omit<RegRef<T>, "reg_name">,
    hooks?: InsinuateHooks
): Promise<LiveEntryTypes<T> | null> {
    let found = await fallback_resolve_ref(from, ctx, ref);
    if (found && found.Registry.name() != from.base.name()) {
        found = (await found.insinuate(from.base, ctx, hooks)) as LiveEntryTypes<T>;
    }
    return found;
}

// Iterate from the fallback regs in sequence
export async function* finding_iterate<T extends EntryType>(
    from: RegFallback,
    ctx: OpCtx,
    cat: T
): AsyncGenerator<LiveEntryTypes<T>, void, void> {
    // Yield from base
    let bv = await from.base.get_cat(cat).list_live(ctx);
    for (let v of bv) {
        yield v;
    }

    // Yield from downstream
    for (let fb of from.fallbacks) {
        bv = await fb.get_cat(cat).list_live(ctx);
        for (let v of bv) {
            yield v;
        }
    }
}
