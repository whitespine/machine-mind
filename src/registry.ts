/**
 * Best practices:
 *
 * All regentries should have an "unpack" function to turn from Compcon (Packed) to Registry (Reg) style. Static generic interfaces are weird so this isn't an explicit typed thing
 *
 * Registry data should preferably be non-undefined. undefined -> 0, "", or [] as appropriate.
 * If a more sensible default exists, then it should be assigned during unpack.
 *
 * "Actor" types, represented by InventoriedRegEntry, have the capability to recall their own unique sub-registry. 
 * This functions like any other registry, but is uniquely associated to that actor
 *
 * When a field describes a list of allowed/forbidden fields, [] means NONE. 
 * If you want to `allow` all, then all must be specified. 
 * If you want to forbid none, provide []
 *
 * When an item is written back and one of its reg-entry's failed to resolve, that reference will be removed. 
 * This may be changed in the future to represent a sort of `Broken Link` state
 *
 * Use SerUtil generic functions where possible, as this will make mass behavior changes much simpler later
 */
import {
    Action,
    Range,
    Bonus,
    CoreBonus,
    Deployable,
    Environment,
    Faction,
    Frame,
    FrameTrait,
    Manufacturer,
    MechSystem,
    MechWeapon,
    Pilot,
    PilotArmor,
    PilotGear,
    PilotWeapon,
    Quirk,
    Reserve,
    Sitrep,
    Skill,
    Status,
    TagTemplate,
    Talent,
    WeaponMod,
    Damage,
    Synergy,
    Mech,
    Counter,
    TagInstance,
    License,
    NpcClass,
    Npc,
    NpcFeature,
    NpcTemplate,
    Organization,
} from "@src/class";
import { assert } from "node:console";
import {
    RegBonusData,
    PackedBonusData,
    RegRangeData,
    ISynergyData,
    PackedCoreBonusData,
    PackedCounterData,
    PackedDeployableData,
    PackedFrameData,
    PackedManufacturerData,
    PackedMechData,
    PackedMechSystemData,
    PackedMechWeaponData,
    PackedNpcClassData,
    PackedNpcTemplateData,
    PackedPilotArmorData,
    PackedPilotData,
    PackedPilotGearData,
    PackedPilotWeaponData,
    PackedReserveData,
    PackedSkillData,
    PackedTagInstanceData,
    PackedTalentData,
    PackedWeaponModData,
    RegCoreBonusData,
    RegCounterData,
    RegDamageData,
    RegDeployableData,
    RegFrameData,
    RegLicenseData,
    RegManufacturerData,
    RegMechData,
    RegMechSystemData,
    RegMechWeaponData,
    RegNpcClassData,
    RegNpcData,
    RegNpcTemplateData,
    RegPilotArmorData,
    RegPilotData,
    RegPilotGearData,
    RegPilotWeaponData,
    RegQuirkData,
    RegReserveData,
    RegSkillData,
    RegTagInstanceData,
    RegTalentData,
    RegWeaponModData,
    AnyRegNpcFeatureData,
    AnyPackedNpcFeatureData,
    RegTagTemplateData,
    RegStatusData,
    RegSitrepData,
    RegFactionData,
    RegEnvironmentData,
    PackedEnvironmentData,
    PackedTagTemplateData,
    RegOrganizationData,
    PackedFactionData,
    PackedOrganizationData,
    PackedSitrepData,
    PackedStatusData,
    RegActionData,
    PackedActionData,
    MidInsinuationRecord,
    InsinuateHooks,
    RelinkHook,
    PackedNpcData,
} from "./interface";

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//////////////////////// TYPE MAAPPINGS ////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, EntryType, and brew
export enum EntryType {
    CORE_BONUS = "core_bonus",
    // CORE_SYSTEM = "core_system", // -- Merged into frame
    DEPLOYABLE = "deployable",
    ENVIRONMENT = "environment",
    FACTION = "faction",
    FRAME = "frame",
    MECH = "mech", // Mech actors
    LICENSE = "license",
    MANUFACTURER = "manufacturer",
    NPC = "npc",
    NPC_CLASS = "npc_class",
    NPC_TEMPLATE = "npc_template",
    NPC_FEATURE = "npc_feature",
    WEAPON_MOD = "weapon_mod",
    MECH_SYSTEM = "mech_system",
    MECH_WEAPON = "mech_weapon",
    ORGANIZATION = "organization",
    PILOT_ARMOR = "pilot_armor",
    PILOT_GEAR = "pilot_gear",
    PILOT_WEAPON = "pilot_weapon",
    PILOT = "pilot",
    RESERVE = "reserve",
    SITREP = "sitrep",
    SKILL = "skill",
    STATUS = "status",
    TAG = "tag",
    TALENT = "talent",
    // CONDITION = "Condition", // Just use statuses
    QUIRK = "quirk",
}

export function is_inventoried_type(t: EntryType): boolean {
    return t == EntryType.PILOT || t == EntryType.MECH || t == EntryType.NPC || t == EntryType.DEPLOYABLE;
}

type _RegTypeMap = { [key in EntryType]: object };
// What our registries hold
export interface FixedRegEntryTypes extends _RegTypeMap {
    // [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: RegCoreBonusData;
    [EntryType.DEPLOYABLE]: RegDeployableData;
    [EntryType.ENVIRONMENT]: RegEnvironmentData;
    [EntryType.FACTION]: RegFactionData;
    [EntryType.FRAME]: RegFrameData;
    [EntryType.LICENSE]: RegLicenseData;
    [EntryType.MANUFACTURER]: RegManufacturerData;
    [EntryType.MECH]: RegMechData;
    [EntryType.MECH_SYSTEM]: RegMechSystemData;
    [EntryType.MECH_WEAPON]: RegMechWeaponData;
    [EntryType.NPC]: RegNpcData;
    [EntryType.NPC_CLASS]: RegNpcClassData;
    [EntryType.NPC_FEATURE]: AnyRegNpcFeatureData;
    [EntryType.NPC_TEMPLATE]: RegNpcTemplateData;
    [EntryType.ORGANIZATION]: RegOrganizationData;
    [EntryType.PILOT_ARMOR]: RegPilotArmorData;
    [EntryType.PILOT_GEAR]: RegPilotGearData;
    [EntryType.PILOT_WEAPON]: RegPilotWeaponData;
    [EntryType.PILOT]: RegPilotData;
    [EntryType.RESERVE]: RegReserveData;
    [EntryType.SITREP]: RegSitrepData;
    [EntryType.SKILL]: RegSkillData;
    [EntryType.STATUS]: RegStatusData;
    [EntryType.TAG]: RegTagTemplateData;
    [EntryType.TALENT]: RegTalentData;
    [EntryType.QUIRK]: RegQuirkData;
    [EntryType.WEAPON_MOD]: RegWeaponModData;
}

export type RegEntryTypes<T extends EntryType> = T extends keyof FixedRegEntryTypes
    ? FixedRegEntryTypes[T]
    : never;

// What compcon holds. 
interface FixedPackedEntryTypes {
    // [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: PackedCoreBonusData;
    [EntryType.DEPLOYABLE]: PackedDeployableData;
    [EntryType.ENVIRONMENT]: PackedEnvironmentData;
    [EntryType.FACTION]: PackedFactionData;
    [EntryType.FRAME]: PackedFrameData;
    [EntryType.LICENSE]: null;
    [EntryType.MANUFACTURER]: PackedManufacturerData;
    [EntryType.MECH]: PackedMechData;
    [EntryType.MECH_SYSTEM]: PackedMechSystemData;
    [EntryType.MECH_WEAPON]: PackedMechWeaponData;
    [EntryType.NPC]: PackedNpcData;
    [EntryType.NPC_CLASS]: PackedNpcClassData;
    [EntryType.NPC_FEATURE]: AnyPackedNpcFeatureData;
    [EntryType.NPC_TEMPLATE]: PackedNpcTemplateData;
    [EntryType.ORGANIZATION]: PackedOrganizationData;
    [EntryType.PILOT_ARMOR]: PackedPilotArmorData;
    [EntryType.PILOT_GEAR]: PackedPilotGearData;
    [EntryType.PILOT_WEAPON]: PackedPilotWeaponData;
    [EntryType.PILOT]: PackedPilotData;
    [EntryType.RESERVE]: PackedReserveData;
    [EntryType.SITREP]: PackedSitrepData;
    [EntryType.SKILL]: PackedSkillData;
    [EntryType.STATUS]: PackedStatusData;
    [EntryType.TAG]: PackedTagTemplateData;
    [EntryType.TALENT]: PackedTalentData;
    [EntryType.QUIRK]: string; // womp womp
    [EntryType.WEAPON_MOD]: PackedWeaponModData;
}

export type PackedEntryTypes<T extends EntryType> = T extends keyof FixedPackedEntryTypes
    ? FixedPackedEntryTypes[T]
    : never;

// What our registries "revive" to, essentially wrapper types
type FixedLiveEntryTypes = {
    // [EntryType.CONDITION]: Status;
    [EntryType.CORE_BONUS]: CoreBonus;
    [EntryType.DEPLOYABLE]: Deployable;
    [EntryType.ENVIRONMENT]: Environment;
    [EntryType.FACTION]: Faction;
    [EntryType.FRAME]: Frame;
    [EntryType.LICENSE]: License;
    [EntryType.MANUFACTURER]: Manufacturer;
    [EntryType.WEAPON_MOD]: WeaponMod;
    [EntryType.MECH]: Mech;
    [EntryType.MECH_SYSTEM]: MechSystem;
    [EntryType.MECH_WEAPON]: MechWeapon;
    [EntryType.NPC]: Npc;
    [EntryType.NPC_CLASS]: NpcClass;
    [EntryType.NPC_FEATURE]: NpcFeature;
    [EntryType.NPC_TEMPLATE]: NpcTemplate;
    [EntryType.ORGANIZATION]: Organization;
    [EntryType.PILOT_ARMOR]: PilotArmor;
    [EntryType.PILOT_GEAR]: PilotGear;
    [EntryType.PILOT_WEAPON]: PilotWeapon;
    [EntryType.PILOT]: Pilot;
    [EntryType.RESERVE]: Reserve;
    [EntryType.SITREP]: Sitrep;
    [EntryType.SKILL]: Skill;
    [EntryType.STATUS]: Status;
    [EntryType.TAG]: TagTemplate;
    [EntryType.TALENT]: Talent;
    [EntryType.QUIRK]: Quirk;
};

export type LiveEntryTypes<T extends EntryType> = T extends keyof FixedLiveEntryTypes
    ? FixedLiveEntryTypes[T]
    : never;

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
///////////////////////// REGISTRY SAVE/LOADING ////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// This type can be used to take a RegEntry subclass as a parameter.
export type EntryConstructor<T extends EntryType> = {
    new (
        type: T,
        registry: Registry,
        ctx: OpCtx,
        lid: string,
        reg_data: RegEntryTypes<T>,
        flags?: any
    ): LiveEntryTypes<T>;
};

export abstract class SerUtil {
    // These functions are just generally pretty useful!

    /*
     * Handles the intake of integrated items.
     * Note that this creates an UNRESOLVED REF, meaning that it may or not exist until we actually attempt to load this item.
     * This reference will exist until the item is saved for the first time, which will override the ref to an actual item ref.
     * We assume they come from the compendium
     */
    public static unpack_integrated_refs(reg: Registry, integrated?: string[]): RegRef<any>[] {
        return (integrated || []).map(i => quick_local_ref(reg, null, i));
    }

    // Just deals with potential nulls
    public static unpack_tag_instances(
        reg: Registry,
        tags?: PackedTagInstanceData[]
    ): RegTagInstanceData[] {
        return (tags || []).map(i => TagInstance.unpack_reg(reg, i));
    }

    /**
     * Unpacks many items using the provided unpacking function and adds them to the registry.
     * The unpacking function is generically typed to fit the `unpack` function defined in most regentry classes.
     * Usually it will take a piece raw reg entry data, but that
     */
    public static async unpack_children<RawPackObj, Entry>(
        unpacking_function: (s: RawPackObj, r: Registry, ctx: OpCtx) => Promise<Entry>,
        reg: Registry,
        ctx: OpCtx,
        items?: RawPackObj[] | undefined
    ): Promise<Entry[]> {
        return Promise.all((items ?? []).map(i => unpacking_function(i, reg, ctx)));
    }

    // Pack up references. This helper allows us to handle the awkward integrated = null cases
    public static ref_all<T extends EntryType>(items: Array<RegEntry<T>>): RegRef<T>[] {
        return items.map(i => i.as_ref());
    }

    // Makes our save code look more consistent
    public static save_all<S, T extends { save(): S }>(items: T[]): S[] {
        return items.map(i => i.save());
    }

    // Makes our emit code look more consistent
    public static emit_all<S, T extends { emit(): Promise<S> }>(items: T[]): Promise<S[]> {
        return Promise.all(items.map(i => i.emit()));
    }
    // Handle null -> undef convrsion
    public static save_all_opt<S, T extends { save(): S }>(items: T[] | null): S[] | undefined {
        return items?.map(i => i.save());
    }

    // Save an array, but drop on empty
    public static drop_empty<V>(vals: V[]): V[] | undefined {
        if (vals.length == 0) {
            return undefined;
        } else {
            return vals;
        }
    }

    // Isolates a value to ensure it is compliant with a list of values
    public static restrict_choices<T extends string>(
        choices: T[],
        default_choice: T,
        provided?: string
    ): T {
        return choices.includes(provided as T) ? (provided as T) : default_choice;
    }

    // List possible values of an enum
    public static list_enum<T extends string>(enum_: { [key: string]: T }): T[] {
        return Object.keys(enum_).map(k => enum_[k]);
    }

    // Isolates a value to ensure it is enum compliant
    public static restrict_enum<T extends string>(
        enum_: { [key: string]: T },
        default_choice: T,
        provided?: string 
    ): T {
        let choices = this.list_enum(enum_);
        return this.restrict_choices(choices, default_choice, provided);
    }

    // Some simple helpers. Doing generic solutions on these ended up being too much of a pain to justify it
    public static process_ranges(ranges?: RegRangeData[]): Range[] {
        return (ranges || []).map(r => new Range(r));
    }

    public static process_damages(damages?: RegDamageData[]): Damage[] {
        return (damages || []).map(r => new Damage(r));
    }

    public static process_synergies(synergies?: ISynergyData[]): Synergy[] {
        return (synergies || []).map(r => new Synergy(r));
    }

    public static process_actions(actions?: RegActionData[]): Action[] {
        return (actions || []).map(a => new Action(a));
    }

    public static process_bonuses(bonuses: RegBonusData[] | undefined, source: string): Bonus[] {
        return (bonuses || []).map(b => new Bonus(b).from_source(source));
    }

    // Because this is so common, we abstract it to here. Shouldn't try to do this for all of them
    public static process_counters(counters?: RegCounterData[]): Counter[] {
        return counters?.map(c => new Counter(c)) || [];
    }

    // Handles the bonuses, actions, synergies, deployables, but not tags, of an item
    public static save_commons(x: {
        Bonuses: Bonus[];
        Actions: Action[];
        Synergies: Synergy[];
        Deployables: Deployable[] /*Tags: TagInstance[]*/;
    }): {
        bonuses: RegBonusData[];
        actions: RegActionData[];
        synergies: ISynergyData[];
        deployables: RegRef<EntryType.DEPLOYABLE>[];
        /*tags: RegTagInstanceData[] */
    } {
        return {
            actions: SerUtil.save_all(x.Actions),
            bonuses: SerUtil.save_all(x.Bonuses),
            synergies: SerUtil.save_all(x.Synergies),
            deployables: SerUtil.ref_all(x.Deployables),
            /* tags: SerUtil.save_all(x.Tags),*/
        };
    }

    // Handles the bonuses, actions, synergies, deployables, but not tags, of an item
    // Does not wait ready, as we expect to only ever use it internally
    public static async load_basd(
        reg: Registry,
        src: {
            bonuses?: RegBonusData[];
            actions?: RegActionData[];
            synergies?: ISynergyData[];
            deployables?: RegRef<EntryType.DEPLOYABLE>[];
            /* tags: RegTagInstanceData[]*/
        },
        target: {
            Bonuses: Bonus[];
            Actions: Action[];
            Synergies: Synergy[];
            Deployables: Deployable[] /*, Tags: TagInstance[] */;
            Name?: string;
            OpCtx: OpCtx;
        },
        bonus_src_text: string
    ): Promise<void> {
        target.Actions = SerUtil.process_actions(src.actions);
        target.Bonuses = SerUtil.process_bonuses(src.bonuses, bonus_src_text);
        target.Synergies = SerUtil.process_synergies(src.synergies);
        target.Deployables = await reg.resolve_many(target.OpCtx, src.deployables ?? [], {wait_ctx_ready: false});
        // target.Tags = await SerUtil.process_tags(reg, src.tags);
    }

    // Hopefully should mitigate a lot of the code duplication I've had floating around
    // Handles the bonuses, actions, synergies, deployables, and tags of an item
    public static async unpack_basdt(
        src: {
            id: string;
            bonuses?: PackedBonusData[];
            actions?: PackedActionData[];
            synergies?: ISynergyData[];
            deployables?: PackedDeployableData[];
            tags?: PackedTagInstanceData[];
        },
        reg: Registry,
        ctx: OpCtx
    ): Promise<{
        bonuses: RegBonusData[];
        actions: RegActionData[];
        synergies: ISynergyData[];
        deployables: RegRef<EntryType.DEPLOYABLE>[];
        tags: RegTagInstanceData[];
    }> {
        // Create deployable entries
        let dep_entries = await Promise.all(
            (src.deployables ?? []).map(i => Deployable.unpack(i, reg, ctx, src.id))
        );
        let deployables = SerUtil.ref_all(dep_entries);

        // Get tags
        let tags = SerUtil.unpack_tag_instances(reg, src.tags);

        // Get bonuses
        let bonuses = (src.bonuses ?? []).map(b => Bonus.unpack(b));

        // Get actions
        let actions = (src.actions ?? []).map(a => Action.unpack(a));

        return {
            bonuses,
            actions,
            synergies: src.synergies ?? [],
            deployables,
            tags,
        };
    }

    // Tags are also an exception I'm willing to make. These should ___maybe___ be moved to their respective classes, but for convenience we keeping here.
    // A typescript wiz could probably abstract it somehow. 
    public static async process_tags(
        reg: Registry,
        ctx: OpCtx,
        tags: RegTagInstanceData[] | undefined
    ): Promise<TagInstance[]> {
        let real_tags = tags?.map(c => new TagInstance(reg, ctx, c)) || [];
        return Promise.all(real_tags.map(t => t.load_done()));
    }

    // We almost never have synced data
    public static unpack_counters_default(counters?: PackedCounterData[]): RegCounterData[] {
        return counters?.map(c => Counter.unpack(c)) || [];
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

// Serialization and deserialization requires a registry, but is not itself an entry.
export abstract class RegSer<SourceType> {
    public readonly Registry: Registry;
    public readonly OpCtx: OpCtx;
    private loading_promise: Promise<void>;

    // Setup
    constructor(registry: Registry, ctx: OpCtx, data: SourceType) {
        this.Registry = registry;
        this.OpCtx = ctx;

        // Load, and when done remove our pending entry
        ctx._notify_loading(this);
        this.loading_promise = this.load(data).finally(() => ctx._notify_done(this));
    }

    // Async ready check
    public async ctx_ready(): Promise<this> {
        await this.OpCtx.ready();
        return this;
    }

    // Use this when we just need to be sure .load() has finished running, but nothing else really is especially important.
    public async load_done(): Promise<this> {
        await this.loading_promise;
        return this;
    }


    // Populate this item with stuff
    protected abstract load(data: SourceType): Promise<void>;

    // Export this item for registry saving back to registry
    public save(): SourceType {
        return this.save_imp();
    }

    protected abstract save_imp(): SourceType;
}

// Controls mechanisms of how a registry loads an item. You probably shouldn't mess with them if you don't have to!
export interface LoadOptions {
    // Whether we should wait for readiness of the OpCtx when doing get_live(), etc
    wait_ctx_ready?: boolean;
}

// Serialization and deserialization requires a registry
// Also, this item itself lives in the registry
export abstract class RegEntry<T extends EntryType> {
    public readonly Type: T;
    public readonly RegistryID: string;
    public readonly Registry: Registry;
    public readonly OpCtx: OpCtx;
    public readonly OrigData: any; // What was loaded for this reg-entry. Is copied back out on save(), but will be clobbered by any conflicting fields. We make no suppositions about what it is
    public Flags: {[key: string]: any}; // Ephemeral data stored on an object. Use however you want. In foundry, we use this to associate with corr. Document

    public abstract LID: string;
    public loading: boolean;
    private loading_promise: Promise<any>; // Just tracks the completion of .load

    // This constructor assumes that we've already got an entry in this registry.
    // If we don't, then just temporarily fool this item into thinking we do by giving a fake id then changing it via any (note: this is spooky. make sure you imp right)
    constructor(
        type: T,
        registry: Registry,
        ctx: OpCtx,
        id: string,
        reg_data: RegEntryTypes<T>,
        flags: any = null
    ) {
        this.Type = type;
        this.Registry = registry;
        this.OpCtx = ctx;
        this.RegistryID = id;
        this.OrigData = reg_data;
        this.Flags = flags;
        ctx.add(this);

        // Load, and when done remove our pending entry
        ctx._notify_loading(this);
        this.loading = true;
        this.loading_promise = this.load(reg_data).finally(() => {
            this.loading = false;
            ctx._notify_done(this);
        });
    }

    // Async ready check
    public async ctx_ready(): Promise<this> {
        await this.OpCtx.ready();
        return this;
    }

    // Use this when we just need to be sure .load() has finished running, but nothing else really is especially important.
    public async load_done(): Promise<this> {
        await this.loading_promise;
        return this;
    }

    // Make a reference to this item
    public as_ref(): RegRef<T> {
        // Attempt to get our id. Default as empty string
        let lid = (this as any).LID ?? "";
        // If our context was set as lid-mode, then we save back as ids whenever possible
        return {
            id: this.RegistryID,
            fallback_lid: lid,
            type: this.Type,
            reg_name: this.Registry.name(),
        };
    }

    // Populate this item with stuff
    protected abstract load(data: RegEntryTypes<T>): Promise<void>;

    // Export this item for registry saving back to registry
    public save(): RegEntryTypes<T> {
        let savedata = this.save_imp();
        return savedata;
    }

    // Export to packed
    public abstract emit(): Promise<PackedEntryTypes<T>>;

    // What we override for saves
    protected abstract save_imp(): RegEntryTypes<T>;

    // Convenience function to update self in registry. Note that this doesn't read first!
    public async writeback(): Promise<void> {
        await this.Registry.get_cat(this.Type).update((this as unknown) as LiveEntryTypes<T>); // please don't make me regret this
    }

    // Convenience function to delete self in registry. Note that you should probably stop using this item afterwards!
    // TODO: Cleanup children? Need some sort of refcounting, maybe.
    public async destroy_entry(): Promise<void> {
        // Remove self from ctx first.
        this.OpCtx.remove(this);

        // Then actually destroy
        await this.Registry.get_cat(this.Type).delete_id(this.RegistryID);
    }

    // Convenience function to load this item as a live copy again. Null occurs if the item was destroyed out from beneath us
    // Generates a new opctx if none is provided, otherwise behaves just like getLive() on this items reg
    // NOTE: the `this` is a possible misnomer if we are to ever expand this system to be more generic
    // in such a case, the registry would need to take as a type parameters a custom RegEntryType and LiveEntryType,
    // and categories would need to infer things and stuff. It's overkill. For the time being we just trust the system
    public async refreshed(ctx?: OpCtx): Promise<this | null> {
        if (ctx && this.OpCtx == ctx) {
            console.warn(
                "Refreshing an item into its selfsame OpCtx will just give you the same object"
            );
        }
        let refreshed = await this.Registry.get_cat(this.Type).get_live(
            ctx ?? new OpCtx(),
            this.RegistryID,
            {wait_ctx_ready: true}
        ); // new opctx to refresh _everything_
        if (!refreshed) {
            console.error("Refresh failed - item was deleted from under MM");
        }
        // @ts-ignore
        return refreshed as this;
    }

    // List all associated items of this item. We assume none by default
    // Note that this is NOT the inventory of an item. It is instead a listing of items that must be brought along if this item is moved
    // Most notably: Integrated systems, weapons, and deployables
    public get_assoc_entries(): Promise<RegEntry<any>[]> | RegEntry<any>[] {
        return [];
    }

    //
    //
    /** Create a copy self in the target DB, bringing along all child items with properly reconstructed links.
     *  This can be the same ctx as the original without issue, but doing so is pretty unlikely to be useful.
     *  Returns said copy. If supplied, ctx will be used for the revival of the newly insinuated data in to_new_reg.
     *  @param to_new_reg Registry we wish to copy this item + its descendants to
     *  @param ctx If provided, the live entry of the item (and its descendants) will be resurrected to this ctx
     *  @param relinker If provided, this function will be applied to every item as it is being insinuated.
     *                  If it returns an Entry, then we will link against that entry instead of creating a new item.
     *                  Note that this cannot change the type of an item. Items relinked in this way will not have their children insinuated.
     */
    public async insinuate(
        to_new_reg: Registry,
        ctx?: OpCtx | null,
        hooks?: InsinuateHooks
    ): Promise<this> {
        // The public exposure of insinuate, which ensures it is safe by refreshing before and after all operations

        // Create a fresh copy, free of any other context. This will be heavily mutated in order to migrate
        let fresh = await this.refreshed();

        // If fresh fails to create - implying deletion of target while we try to insinuate - we abort the operation
        if (!fresh) {
            throw new Error("Cannot insinuate a deleted item: undefined behavior");
        }

        // Create a mapping of original items to Insinuation records
        let hitlist: Map<RegEntry<EntryType>, MidInsinuationRecord<EntryType>> = new Map();
        await (fresh as RegEntry<EntryType>)._insinuate_imp(to_new_reg, hitlist, hooks || {});

        // At this point no more processing is going to occur - our entire data structure should have been transferred over to the new reg
        // However, what _hasn't_ yet been processed / updated are our reg entry references - they're still saved as their original ids
        // So we write all back once more with the new reference structure established
        for (let record of hitlist.values()) {
            // Call pre-write-save hooks. Callsite provided go first, then registry defined
            let dest_reg = record.pending.Registry;
            let dest_cat = dest_reg.get_cat(record.type);
            if (hooks?.pre_final_write) {
                await hooks?.pre_final_write(record, dest_reg, dest_cat);
            }
            if (dest_reg.hooks.pre_final_write) {
                await dest_reg.hooks.pre_final_write(record, dest_reg, dest_cat);
            }

            // Then writeback. Even if the above hook doesn't exist, this is necessary to fix RegRefs
            await record.pending.writeback();
        }

        // We do not want `fresh` itself, as its references will be wacky. Instead, re-fetch fresh from the new registry, with a new ctx (or into a provided ctx)
        ctx = ctx ?? new OpCtx();
        let fresher = await fresh.refreshed(ctx);
        if (!fresher) {
            throw new Error(
                "Something went wrong during insinuation: an item was not actually created properly, or an old item had been deleted during insinuation."
            );
        }

        // Trigger post insinuation hook on the new reg for every item
        // One might thing "oh no won't this be expensive?". Nope! The refresh to get `fresher` has likely already prefetched most of them to ctx
        for (let record of hitlist.values()) {
            let new_v = await record.pending.refreshed(ctx);
            if (!new_v) {
                throw new Error(
                    "Something went wrong during insinuation: an item was not actually created properly, or an old item had been deleted during insinuation."
                );
            }
            let final_record = {
                from: { ...record.from },
                type: record.type,
                new_item: new_v,
            };

            // Call post-write-save hooks. Callsite provided go first, then registry defined
            let dest_reg = new_v.Registry;
            let dest_cat = dest_reg.get_cat(final_record.type);
            if (hooks?.post_final_write) {
                hooks.post_final_write(final_record, dest_reg, dest_cat);
            }
            if (dest_reg.hooks.post_final_write) {
                dest_reg.hooks.post_final_write(final_record, dest_reg, dest_cat);
            }
        }

        return fresher;
    }

    // Note that since a live copy is always a mere reflection of the underlying reg data, this has no effect on the original reg
    // In order to properly resettle children, we require valid implementations of get_child_entries
    // Insinuation hit list is used to track which items are already being insinuated, so as not to get caught in cycles
    // Return value is the temporary new live entry we used to generate the ID. NOTE THAT IT IS NOT MEANT TO BE RETURNED - IT IS SUPER UNSTABLE
    // it is, however, needed for inventoried regs to figure out their new inventory location. Null indicates no insinuation occurred due to circular reference protection
    // See above
    public async _insinuate_imp(
        to_new_reg: Registry,
        insinuation_hit_list: Map<RegEntry<any>, MidInsinuationRecord<any>>,
        hooks: InsinuateHooks
    ): Promise<LiveEntryTypes<T> | null> {
        // Check if we've been hit to avoid circular problems
        if (insinuation_hit_list.has(this)) {
            return null;
        }

        // Before messing with things too much, retrieve our associated entites to recurse to
        let assoc = await this.get_assoc_entries();

        // If this item is an inventoried type, make sure we promote to an actor level registry
        if(this instanceof InventoriedRegEntry) {
            to_new_reg = await to_new_reg.get_actor_level_reg();
        }

        // To insinuate this specific item is fairly simple. Just save the data, then create a corresponding entry in the new reg
        // We change our registry before saving as a just-in-case. It shouldn't really matter
        // This is the only situation in which the Registry or RegistryID of a live object can change
        (this as any).Registry = to_new_reg;
        let saved = (this.save() as unknown) as RegEntryTypes<T>;

        // If we have a relink hook, apply it now
        let new_entry: LiveEntryTypes<T> | null = null;
        let fun_relinked = false;
        let reg_relinked = false;
        if (hooks?.relinker) {
            new_entry = await hooks.relinker(
                (this as unknown) as LiveEntryTypes<T>,
                to_new_reg,
                to_new_reg.get_cat(this.Type) as any  // As eventually concluded in an hours-long discussion, there's no clean way around this shit
            ) as LiveEntryTypes<T>;
            fun_relinked = !!new_entry;
        }

        // Also try relinking using registry relinker if possible
        if (to_new_reg.hooks.relinker && !fun_relinked) {
            new_entry = await to_new_reg.hooks.relinker(
                (this as unknown) as LiveEntryTypes<T>,
                to_new_reg,
                to_new_reg.get_cat(this.Type) as any
            ) as LiveEntryTypes<T>;
            reg_relinked = !!new_entry;
        }

        // If no relink hook / relink hook didn't produce anything useful
        if (!new_entry) {
            // Create an entry with the saved data. This is essentially a duplicate of this item on the other registry
            // however, this new item will (somewhat predictably) fail to resolve any of its references. We don't care - we just want its id
            new_entry = await to_new_reg.create_live(this.Type, this.OpCtx, saved);
        }

        if(new_entry.Type != this.Type) {
            throw new Error(`Insinuation hooks somehow produced an item of a different type (${this.Type} -> ${new_entry.Type}). Aborting.`);
        }

        // Update our ID to mimic the new entry's registry id. Note that we might not be a valid live entry at this point - any number of data integrity issues could happen from this hacky transition
        // Thankfully, all we really need to do is have this ID right / be able to save validly, so the outer insinuate method can make all of the references have the proper id's
        let orig_from = this.as_ref(); // Save this so callbacks can know what we used to be
        (this as any).RegistryID = new_entry.RegistryID;
        (this as any).Registry = new_entry.Registry;
        (this as any).Flags = new_entry.Flags;

        // Mark our new item. Note that this "new_item" will be replaced later with a refreshed copy
        insinuation_hit_list.set(this, {
            pending: this,
            from: orig_from,
            type: this.Type,
        });

        // Ask all of our live children to insinuate themselves. They will insinuate recursively. Don't if relinking, as we assume the relink target already has this basically handled.
        // If the user wants it to be regenerated, they can just delete the item
        if (!fun_relinked && !reg_relinked) {
            for (let child of assoc) {
                await child._insinuate_imp(to_new_reg, insinuation_hit_list, hooks); // Ensure that they don't get root call true. This prevents dumb save-thrashing
            }
        }

        if (fun_relinked && hooks?.skip_relinked_inventories) {
            return null; // Essentially drops the inventory
        } else if (reg_relinked && to_new_reg.hooks.skip_relinked_inventories) {
            return null; // Ditto
        } else {
            // Even if this didn't produce a new item, we still wish to return.
            // This return (right now) exclusively controls if we want to do inventory transfer or not. We do, unless relinker options say otherwise
            return new_entry;
        }
    }
}

export abstract class InventoriedRegEntry<T extends EntryType> extends RegEntry<T> {
    // What does this item own? We ask our reg for another reg, trusting in the uniquness of nanoid's to keep us in line
    async get_inventory(): Promise<Registry> {
        let v = this.Registry.switch_reg_inv(this);
        if (!v) {
            console.error(
                `Couldn't lookup inventory registry for item ${this.Type}:${this.RegistryID}`
            );
            return this.Registry;
        }
        return v;
    }

    // used for insinuation. All these items, contained in this items inventory, will be brought along with
    protected abstract enumerate_owned_items(): RegEntry<EntryType>[];

    // Insinuation logic is a bit different as well, since we want to drag items along to our new inventory
    public async _insinuate_imp(
        to_new_reg: Registry,
        insinuation_hit_list: Map<RegEntry<EntryType>, MidInsinuationRecord<EntryType>>,
        hooks: InsinuateHooks
    ): Promise<LiveEntryTypes<T> | null> {
        // Get our super call. Since new entry is of same type, then it should also have an inventory
        let new_reg_entry = (await super._insinuate_imp(
            to_new_reg,
            insinuation_hit_list,
            hooks
        )) as InventoriedRegEntry<T> | null;

        // If it went off, then we want to insinuate all items from our inventory to the new regs inventory
        if (new_reg_entry) {
            // Get every item.
            let all_items = this.enumerate_owned_items();

            // Get our new target reg (the new entry's inventory)
            let new_inventory = await new_reg_entry.get_inventory();

            // Insinuate them all
            for (let i of all_items) {
                await i._insinuate_imp(new_inventory, insinuation_hit_list, hooks);
            }

            // At last, return the original value. Our work is done
            return (new_reg_entry as unknown) as LiveEntryTypes<T>; // Why typescript hurt me so
        } else {
            // Super returned null so so do we
            return null;
        }
    }
}

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
///////////////////////// REGISTRY /////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

// Reg is for looking up other values. ID is the id that this item will/already has in the reg
// If raw is supplied as undefined, produce a desired default value (e.g. to create a new default value)
// IT IS THE SOLE RESPONSIBILITY OF THE REVIVE FUNC TO CHECK THE OPCTX FOR PRE-FETCHED ITEMS!!!!!
export type ReviveFunc<T extends EntryType> = (
    reg: Registry,
    ctx: OpCtx,
    id: string,
    raw: RegEntryTypes<T>,
    init_flags: any, // The initial flag values are set ere. If you don't want them to be anything, just leave as undefined
    load_options?: LoadOptions
) => Promise<LiveEntryTypes<T>>;

// This class deduplicates circular references by ensuring that any `resolve` calls can refer to already-instantiated objects wherever possible
export class OpCtx {
    // We rely entirely on no collisions here. Luckily, they are nigh-on impossible with nanoids, and even with foundry's keys at the scale we are using
    private resolved: Map<string, any> = new Map(); // Maps lookups with a key in a specified registry to their results

    get(reg_name: string, id: string): RegEntry<any> | null {
        return this.resolved.get(reg_name + "." + id) ?? null;
    }

    // Tell the ctx that we resolved <ref> as <val>
    set(reg_name: string, id: string, val: RegEntry<any>) {
        // Make the reg entry if not there
        this.resolved.set(reg_name + "." + id, val);
    }

    // Removes a quantity from a ctx, e.g. in case of deletion or migration (? not sure on migration. they maybe need to re-create selves????)
    delete(reg_name: string, id: string) {
        this.resolved.delete(reg_name + "." + id);
    }

    // A helper on set, simply extracts the appropriate fields
    add(item: RegEntry<any>) {
        this.set(item.Registry.name(), item.RegistryID, item);
    }

    // A helper on delete, simply extracts the appropriate fields
    remove(item: RegEntry<any>) {
        this.delete(item.Registry.name(), item.RegistryID);
    }


    // Readiness checking
    private num_pending_operations: number = 0;  // Incremented whenever the db is entering into a state where not everything it maps to is necessarily loaaded
    private _pending_readies: Array<(x?: any) => any> = [];  // Promise resolve functions that are 

    // Await this to wait until all load functions are finished
    ready(): Promise<void> {
        // If any loading return a promise
        if(this.num_pending_operations) {
            return new Promise((succ, fail) => {
                this._pending_readies.push(succ);
            });
        } else {
            // If no pending operations just resolve
            return Promise.resolve();
        }
    }

    // Call this when beginning an operation that puts things into an invalid state-
    _notify_loading(entry: RegEntry<any> | RegSer<any>) {
        this.num_pending_operations++;
    }

    // And call this when you have settled the invalid state (or, at least, settled the part that that function was concerned with).
    // When all settled, resolve all ready promises
    _notify_done(entry: RegEntry<any> | RegSer<any>) {
        this.num_pending_operations--;
        if(this.num_pending_operations <= 0) {
            this.num_pending_operations = 0;

            // Call all successes and clear
            for(let p of this._pending_readies) {
                p();
            }
            this._pending_readies = [];
        }
    }
}

export abstract class RegCat<T extends EntryType> {
    // Need this to key them because we can't really identify otherwise
    cat: T;

    // Creation func needed to create live entries from reg entries
    revive_func: ReviveFunc<T>;

    // Need this for like, basically everything
    registry: Registry;

    constructor(parent: Registry, cat: T, creator: ReviveFunc<T>) {
        this.registry = parent;
        this.cat = cat;
        this.revive_func = creator;
    }

    // Find a value by some arbitrary criteria
    abstract lookup_raw(
        criteria: (e: RegEntryTypes<T>) => boolean
    ): Promise<{ id: string; val: RegEntryTypes<T> } | null>;

    async lookup_live(
        ctx: OpCtx,
        criteria: (e: RegEntryTypes<T>) => boolean,
        load_options?: LoadOptions
    ): Promise<LiveEntryTypes<T> | null> {
        let lookup = await this.lookup_raw(criteria);
        return lookup ? this.get_live(ctx, lookup.id, load_options) : null;
    }

    // Find a value by lid. Just wraps above - common enough to warrant its own helper
    lookup_lid_raw(lid: string): Promise<{ id: string; val: RegEntryTypes<T> } | null> {
        return this.lookup_raw(e => (e as any).lid == lid);
    }

    lookup_lid_live(ctx: OpCtx, lid: string, load_options?: LoadOptions): Promise<LiveEntryTypes<T> | null> {
        return this.lookup_live(ctx, e => (e as any).lid == lid, load_options);
    }

    // Fetches the specific raw item of a category by its ID
    abstract get_raw(id: string): Promise<RegEntryTypes<T> | null>;

    // Fetches all raw items of a category
    abstract raw_map(): Promise<Map<string, RegEntryTypes<T>>>;

    // The above, but as a list
    async iter_raw(): Promise<Iterable<RegEntryTypes<T>>> {
        return (await this.raw_map()).values();
    }

    // Instantiates a live interface of the specific raw item. Convenience wrapper
    abstract get_live(ctx: OpCtx, id: string, load_options?: LoadOptions): Promise<LiveEntryTypes<T> | null>;

    // Fetches all live items of a category. Little expensive but fine when you really need it, e.g. when unpacking
    abstract list_live(ctx: OpCtx, load_options?: LoadOptions): Promise<Array<LiveEntryTypes<T>>>;

    // Save the given live item(s), propagating any changes made to it to the backend data source
    // Implementation should enforce that items actually come from this reg...
    abstract update_impl(...items: LiveEntryTypes<T>[]): Promise<void>;
    update(...items: LiveEntryTypes<T>[]): Promise<void> {
        // Sanity check
        for(let i of items) {
            if(i.Registry.name() != this.registry.name()) {
                throw new Error("RegCat should only be tasked with updating items that came from its associated Registry");
            }
        }
        return this.update_impl(...items);
    }

    // Delete the given id in the given category. 
    abstract delete_id(id: string): Promise<void>;

    // Create a new entry(s) in the database with the specified data. Generally, you cannot control the output ID
    abstract create_many_live(
        ctx: OpCtx,
        ...vals: Array<RegEntryTypes<T>>
    ): Promise<LiveEntryTypes<T>[]>;

    // A simple singular form if you don't want to mess with arrays
    async create_live(ctx: OpCtx, val: RegEntryTypes<T>): Promise<LiveEntryTypes<T>> {
        // TODO: remove this debug flag, probably
        if(this.registry.is_inventory && is_inventoried_type(this.cat)) {
            throw new Error(`Creating inventoried entry type "${this.cat}" inside another inventory is forbidden`);
        }

        let vs = await this.create_many_live(ctx, val);
        return vs[0];
    }

    // For when you don't need a live
    abstract create_many_raw(...vals: Array<RegEntryTypes<T>>): Promise<RegRef<T>[]>;

    async create_raw(val: RegEntryTypes<T>): Promise<RegRef<T>> {
        return (await this.create_many_raw(val))[0];
    }

    // Create a new entry in the database with the creation func's default data. Generally, you cannot control the output ID
    abstract create_default(ctx: OpCtx): Promise<LiveEntryTypes<T>>;
}

export abstract class Registry /* <T extends RegCat<any> = RegCat<any>> */ {
    /**
     * A registry is fundamentally just a wrapper (or self contained) manager of RegEntry items.
     * It contains their raw data, indexed by IDs, and provides mechanisms for their creation, deletion, sorting, finding etc.
     *
     * An important thing to note is that this was built with the foundry vtt paradigm in mind, wherein there are MANY possible
     * places that "contain" regentry items; compendiums can hold actors, actors can hold items, etc.
     * A Registry object is just ONE of these. As such, most registries will in fact be nearly empty.
     */
    // This just maps to the other cats below
    private cat_map: Map<EntryType, RegCat<any>> = new Map(); // We cannot definitively type this here, unfortunately. If you need definitives, use the below

    // Our hooks, if we want them. Subclass constructors should populate as they see fit
    public hooks: InsinuateHooks = {};

    // Use at initialization. Sets the provided category to its appropriate place in the cat map
    public init_set_cat<T extends EntryType>(cat: RegCat<T>) {
        this.cat_map.set(cat.cat, cat);
    }

    // Throws an error if not all entrytypes are properly represented
    public init_finalize() {
        for (let t of SerUtil.list_enum(EntryType)) {
            if (!this.cat_map.has(t)) {
                throw Error(`Category ${t} not set`);
            }
        }
    }

    // Create a live item. Shorthand for get cat and create
    public async create_live<T extends EntryType>(
        type: T,
        ctx: OpCtx,
        val?: RegEntryTypes<T>
    ): Promise<LiveEntryTypes<T>> {
        if (val) {
            return this.get_cat(type).create_live(ctx, val);
        } else {
            return this.get_cat(type).create_default(ctx);
        }
    }

    // Shorthand for get_cat(type).get_live(ctx, id);
    public async get_live<T extends EntryType>(
        type: T,
        ctx: OpCtx,
        id: string,
        load_options?: LoadOptions
    ): Promise<LiveEntryTypes<T> | null> {
        return this.get_cat(type).get_live(ctx, id, load_options);
    }

    // Shorthand for get_cat(type).get_raw(id);
    public async get_raw<T extends EntryType>(
        type: T,
        id: string
    ): Promise<RegEntryTypes<T> | null> {
        return this.get_cat(type).get_raw(id);
    }

    // Delete an item, by cat + id. Just delegates through get_cat
    public async delete(cat: EntryType, id: string) {
        this.get_cat(cat).delete_id(id);
    }

    // In theory should never fail because of type bounding, so long as all cats were loaded that is
    // Get a category
    public get_cat<T extends EntryType>(cat: T): RegCat<T> {
        let v = this.cat_map.get(cat as EntryType);
        if (!v) {
            throw new Error(`Error: Category "${cat}" does not exist`);
        }
        return v;
    }

    // A bit cludgy, but looks far and wide to find things with the given id(s), yielding the first match of each.
    // Implementation of this is a bit weird, as this would usually mean that you DON'T want to look in the current registry
    // As such its implementation is left up to the user.
    public async resolve_wildcard_lid(
        ctx: OpCtx,
        lid: string,
        load_options?: LoadOptions
    ): Promise<LiveEntryTypes<EntryType> | null> {
        // Otherwise we go a-huntin in all of our categories
        for (let cat of this.cat_map.values()) {
            let attempt = await cat.lookup_lid_live(ctx, lid, load_options);
            if (attempt) {
                // We found it!
                return attempt;
            }
        }

        // It is unfindable
        return null;
    }

    // Find the item corresponding to this ref
    // This function (along with resolve_wildcard_lid) actually performs all of the resolution of references
    public async resolve<T extends EntryType>(
        ctx: OpCtx,
        ref: RegRef<T>,
        load_options?: LoadOptions
    ): Promise<LiveEntryTypes<T> | null> {
        // It's the damn wild west out there, so we first do a check that ref is a real ref, as best as we can tell
        if (!ref || !ref.reg_name) {
            return null;
        }

        // Either way, generally wrap this in a try catch because an error while retrieving is more of a "failed to retrieve" than an error, yeah?
        try {
            // Check name
            if (ref.reg_name != this.name()) {
                let appropriate_reg = await this.switch_reg(ref.reg_name);
                if (appropriate_reg) {
                    return appropriate_reg.resolve(ctx, ref, load_options);
                } else {
                    return null;
                }
            }

            // Haven't resolved this yet
            let result: LiveEntryTypes<any> | null = null;

            // First try standard by id
            if (ref.id && ref.type) {
                result = await this.get_cat(ref.type!).get_live(ctx, ref.id, load_options);
            }

            // Failing that try fallback lid
            if (!result && ref.fallback_lid) {
                if (ref.type) {
                    result =
                        (await this.get_cat(ref.type).lookup_lid_live(
                            ctx,
                            ref.fallback_lid,
                            load_options
                        )) ?? null;
                } else {
                    result = await this.resolve_wildcard_lid(ctx, ref.fallback_lid, load_options);
                }
            }
            return result;
        } catch (e) {
            if (e instanceof Error) {
                Error.prepareStackTrace;
                console.error(`Error '${e.name}: ${e.message}' while resolving ref:`, ref, e);
                return null;
            } else {
                throw e; // What the hell is this
            }
        }
    }

    // Resolves as many refs as it can. Filters null results. Errors naturally on invalid cat. Can be of mixed types, but types don't inherently support that
    public async resolve_many<T extends EntryType>(
        ctx: OpCtx,
        refs: RegRef<T>[],
        load_options?: LoadOptions
    ): Promise<Array<LiveEntryTypes<T>>> {
        if (!refs) {
            return [];
        }
        let resolves = await Promise.all(refs.map(r => this.resolve(ctx, r, load_options)));
        resolves = resolves.filter(d => d != null);
        return resolves as LiveEntryTypes<any>[]; // We filtered the nulls
    }

    // Returns the inventory registry of the specified id. Implementation is highly domain specific - foundry needs specifiers for type _and_ id. In such cases, would recommend compound id, like "actor:123456789"
    public abstract switch_reg(selector: string): this | null | Promise<this | null>;

    // Wraps switch_reg. Provides an inventory for the given inventoried unit
    public abstract switch_reg_inv(
        for_inv_item: InventoriedRegEntry<EntryType>
    ): Registry | Promise<Registry>;

    // If this is registry is representing an inventoried item. Should be fast
    public abstract get inventory_for_ref(): RegRef<EntryType> | null;

    // True iff this is an inventory. Should never create actors in an inventory.
    public get is_inventory(): boolean {
        return this.inventory_for_ref != null;
    }

    // If this is not an actor-level registry, get the registry that holds that actor
    public async get_actor_level_reg(): Promise<this> {
        let ref = this.inventory_for_ref;
        let reg = ref ? await this.switch_reg(ref.reg_name) : null;
        return reg ?? this;
    }

    // Returns the name by which this reg would be fetched via switch_reg
    public abstract name(): string;
}

// "Refs" handle cross referencing of entries, and is used to establish ownership and heirarchy in static data store (where normal js refs dont' really work)
// Usually, a ref has a specific type. For instance, a reference to a weapon would be a RegRef<EntryType.MECH_WEAPON>. They can/should be resolved via the `resolve` or `resolve_many` functions.
// Sometimes we do not know the type. These are typed as RegRef<any>.
//
// Sometimes, we don't even know the item's actual unique registry-id, and instead only know the compcon-provided id. Slightly perplexingly, I decided to call these "lid"s. I don't remember why. Just roll with it
// These are typically encountered only on freshly unpacked daata, and provide a means of navigating tricky chicken-egg scenarios by leaving the references unresolved until the items are first loaded.
// For the most part every rough ref is an unresolved lid, though there are certain cases where theoretically one might simply not know the type of
// Use rough basically only when you cannot be explicit about the type, IE for unresolved lids
// If lid is resolved but you have a mixed content array, might still be / definitely is better to just use `any`
export interface RegRef<T extends EntryType> {
    // The item id
    id: string;

    // The lid to resolve, as a fallback to if the id couldn't be resolve / is just "" (same thing, I suppose)
    // Holds the compcon style id, e.x. mf_lancaster
    // If does not exist, will be "".
    fallback_lid: string;

    // The category we are referencing. If null, it is unknown (only used for unresolved lids - avoid if possible)
    type: T | null;

    // The name of the reg we expect to find this item in. If we cannot resolve this to another reg, we just treat it as though it is expected in the source reg
    reg_name: string;
}

// Quickly make an lid-based reference reference
export function quick_local_ref<T extends EntryType>(
    reg: Registry,
    type: T | null,
    lid: string
): RegRef<T> {
    return {
        id: "",
        fallback_lid: lid,
        type: type as T | null,
        reg_name: reg.name(),
    };
}

interface QuickRelinkParams<T extends EntryType> {
    key_pairs: Array<[keyof LiveEntryTypes<T>, keyof RegEntryTypes<T>]>; // Left will be read from src_item, right from the reg entry data. If both exist and equal, then that will be relinked. Checked in order
    blacklist?: Array<any>; // If the value read from src_item is in (checked via ==) this array, then that source item will not be considered for relinking
}

/**
 * A utility function for quickly creating relinking functions that associate by one or more property names
 */
export function quick_relinker<T extends EntryType>(params: QuickRelinkParams<T>): RelinkHook<T> {
    return async (src_item, dest_reg, dest_cat) => {
        // First check blacklist
        for (let forbidden of params.blacklist ?? []) {
            for (let kp of params.key_pairs) {
                let src_item_val = src_item[kp[0]];
                if (src_item_val == forbidden) {
                    return null;
                }
            }
        }

        // Ok, none of the kvp items seem to have been blacklisted. Now we process them in order
        for (let kp of params.key_pairs) {
            let src_item_val = src_item[kp[0]];
            if (src_item_val) {
                let found = await dest_cat.lookup_live(
                    src_item.OpCtx,
                    v => (v[kp[1]] as any) == src_item_val,
                    {
                        wait_ctx_ready: true // I honestly have no idea, but I think this is right
                    }
                );
                if (found) {
                    return found;
                }
            }
        }

        // No kvp worked
        return null;
    };
}