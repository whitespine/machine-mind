/**
 * Best practices:
 *
 * All regentries should have an "unpack" function to turn from Compcon (Packed) to Registry (Reg) style
 *
 * Registry data should preferably be non-nullable. undefined -> 0, "", or [] as appropriate.
 * If a more sensible default exists, then it should be assigned during unpack.
 *
 * A unique situation we encounter is that in some cases, it only makes sense for an entity to know about certain other entities
 * (and more importantly, it is more efficient/easily logically to ask "Where is MY <lmg>" vs "Where is <lmg>")
 * We handle this by having pilots, mechs, and npcs each have their own inventory (in the form of a Registry). (maybe deployables? What would they own? statuses, maybe. Foundry supports regardless but begs the question of what the point is)
 *
 * Relations can be cross-registry (i.e. between items with their own registries).
 * This brings us to an important mandate: ALL REGISTRY-OWNING ITEM CATEGORIES MUST BE GLOBAL / HAVE SOME METHOD OF CROSS-REGISTRY LOOKUP
 * Foundry does this for us by getActor methods. Anyone else will have to roll something themselves (check static_registry)
 * The key distinction for these types is that
 *  - The cat's for these types should behave identically between ALL items (in the same environment). The lowliest system mod should be able to find any pilot
 *  - These items meet the above situation of pilots/mechs having their own inventory
 *  - These items can freely retrive their own regs. One can also just deliberately grab a registry by its id.
 * In theory you could not do the above if you had a strictly-downward-waterfalling heirarchy, but this is weird
 *
 *
 * When a field describes a list of allowed/forbidden fields, [] means NONE.
 * undefined should either mean None or does not apply, contextually.
 * It might be easier to just treat as null in those cases. However, never store as null
 *
 * Resolving MMID's is recommended to be done via unpacking from a static IContentPack array.
 * Though this might seem inefficient, note that this is only done on item/actor creation, where performance really isn't much of a concern
 *
 * RegEntries should define a heirarchy by which they can/should be deleted. Typically, only the "top" entry in any tree should allow normal deletion
 * Otherwise, should prompt to delete entire heirarchy
 * An exception to this is Frames, which are more likely to be customized to the point that they might want less/more integrated systems and traits
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
    CoreSystem,
    Mech,
    Counter,
    TagInstance,
    License,
} from "@src/class";
import { IOrganizationData, Organization } from "./classes/pilot/reserves/Organization";
import {
    IActionData,
    IBonusData,
    IEnvironmentData,
    IFactionData,
    IRangeData,
    // INpcClassData,
    // INpcFeatureData,
    // INpcTemplateData,
    ISitrepData,
    IStatusData,
    ISynergyData,
    ITagTemplateData,
    PackedCoreBonusData,
    PackedCoreSystemData,
    PackedCounterData,
    PackedDeployableData,
    PackedFrameData,
    PackedFrameTraitData,
    PackedManufacturerData,
    PackedMechData,
    PackedMechSystemData,
    PackedMechWeaponData,
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
    RegCoreSystemData,
    RegCounterData,
    RegDamageData,
    RegDeployableData,
    RegFrameData,
    RegFrameTraitData,
    RegLicenseData,
    RegManufacturerData,
    RegMechData,
    RegMechSystemData,
    RegMechWeaponData,
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
    CORE_BONUS = "Core Bonus",
    CORE_SYSTEM = "Core System",
    DEPLOYABLE = "Deployable",
    ENVIRONMENT = "Environment",
    FACTION = "Faction",
    FRAME = "Frame",
    FRAME_TRAIT = "Frame Trait",
    MECH = "Mech", // Mech actors
    LICENSE = "License",
    MANUFACTURER = "Manufacturer",
    // NPC_CLASS = "NpcClasse",
    // NPC_TEMPLATE = "NpcTemplate",
    // NPC_FEATURE = "NpcFeature",
    WEAPON_MOD = "Weapon Mod",
    MECH_SYSTEM = "Mech System",
    MECH_WEAPON = "Mech Weapon",
    ORGANIZATION = "Organization",
    PILOT_ARMOR = "Pilot Armor",
    PILOT_GEAR = "Pilot Gear",
    PILOT_WEAPON = "Pilot Weapon",
    PILOT = "Pilot",
    RESERVE = "Reserve",
    SITREP = "Sitrep",
    SKILL = "Skill",
    STATUS = "Status",
    TAG = "Tag",
    TALENT = "Talent",
    // CONDITION = "Condition", // Just use statuses
    QUIRK = "Quirk",
}

type _RegTypeMap = { [key in EntryType]: object };
// What our registries hold
export interface FixedRegEntryTypes extends _RegTypeMap {
    // [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: RegCoreBonusData;
    [EntryType.CORE_SYSTEM]: RegCoreSystemData;
    [EntryType.DEPLOYABLE]: RegDeployableData;
    [EntryType.ENVIRONMENT]: IEnvironmentData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: RegFrameData;
    [EntryType.FRAME_TRAIT]: RegFrameTraitData;
    [EntryType.LICENSE]: RegLicenseData;
    [EntryType.MANUFACTURER]: RegManufacturerData;
    [EntryType.MECH]: RegMechData;
    [EntryType.MECH_SYSTEM]: RegMechSystemData;
    [EntryType.MECH_WEAPON]: RegMechWeaponData;
    // [EntryType.NPC_CLASS]: INpcClassData;
    // [EntryType.NPC_FEATURE]: INpcFeatureData;
    // [EntryType.NPC_TEMPLATE]: INpcTemplateData;
    [EntryType.ORGANIZATION]: IOrganizationData;
    [EntryType.PILOT_ARMOR]: RegPilotArmorData;
    [EntryType.PILOT_GEAR]: RegPilotGearData;
    [EntryType.PILOT_WEAPON]: RegPilotWeaponData;
    [EntryType.PILOT]: RegPilotData;
    [EntryType.RESERVE]: RegReserveData;
    [EntryType.SITREP]: ISitrepData;
    [EntryType.SKILL]: RegSkillData;
    [EntryType.STATUS]: IStatusData;
    // [EntryType.STATUS]: IStatusData;
    [EntryType.TAG]: ITagTemplateData;
    [EntryType.TALENT]: RegTalentData;
    [EntryType.QUIRK]: RegQuirkData;
    [EntryType.WEAPON_MOD]: RegWeaponModData;
}

export type RegEntryTypes<T extends EntryType> = T extends keyof FixedRegEntryTypes
    ? FixedRegEntryTypes[T]
    : object;

// What compcon holds. Unsure how useful this is???
interface FixedPackedEntryTypes {
    // [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: PackedCoreBonusData;
    [EntryType.CORE_SYSTEM]: PackedCoreSystemData;
    [EntryType.DEPLOYABLE]: PackedDeployableData;
    [EntryType.ENVIRONMENT]: IEnvironmentData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: PackedFrameData;
    [EntryType.FRAME_TRAIT]: PackedFrameTraitData;
    [EntryType.LICENSE]: null;
    [EntryType.MANUFACTURER]: PackedManufacturerData;
    [EntryType.MECH]: PackedMechData;
    [EntryType.MECH_SYSTEM]: PackedMechSystemData;
    [EntryType.MECH_WEAPON]: PackedMechWeaponData;
    // [EntryType.NPC_CLASS]: INpcClassData;
    // [EntryType.NPC_FEATURE]: INpcFeatureData;
    // [EntryType.NPC_TEMPLATE]: INpcTemplateData;
    [EntryType.ORGANIZATION]: IOrganizationData;
    [EntryType.PILOT_ARMOR]: PackedPilotArmorData;
    [EntryType.PILOT_GEAR]: PackedPilotGearData;
    [EntryType.PILOT_WEAPON]: PackedPilotWeaponData;
    [EntryType.PILOT]: PackedPilotData;
    [EntryType.RESERVE]: PackedReserveData;
    [EntryType.SITREP]: ISitrepData;
    [EntryType.SKILL]: PackedSkillData;
    [EntryType.STATUS]: IStatusData;
    [EntryType.TAG]: ITagTemplateData;
    [EntryType.TALENT]: PackedTalentData;
    [EntryType.QUIRK]: string; // womp womp
    [EntryType.WEAPON_MOD]: PackedWeaponModData;
}

export type PackedEntryTypes<T extends EntryType> = T extends keyof FixedPackedEntryTypes
    ? FixedPackedEntryTypes[T]
    : object;

// What our registries "revive" to, essentially wrapper types
type FixedLiveEntryTypes = {
    // [EntryType.CONDITION]: Status;
    [EntryType.CORE_BONUS]: CoreBonus;
    [EntryType.CORE_SYSTEM]: CoreSystem;
    [EntryType.DEPLOYABLE]: Deployable;
    [EntryType.ENVIRONMENT]: Environment;
    [EntryType.FACTION]: Faction;
    [EntryType.FRAME]: Frame;
    [EntryType.FRAME_TRAIT]: FrameTrait;
    [EntryType.LICENSE]: License;
    [EntryType.MANUFACTURER]: Manufacturer;
    [EntryType.WEAPON_MOD]: WeaponMod;
    [EntryType.MECH]: Mech;
    [EntryType.MECH_SYSTEM]: MechSystem;
    [EntryType.MECH_WEAPON]: MechWeapon;
    // [EntryType.NPC_CLASS]: NpcClass;
    // [EntryType.NPC_FEATURE]: NpcFeature;
    // [EntryType.NPC_TEMPLATE]: NpcTemplate;
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
    : RegEntry<T>;

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
        id: string,
        reg_data: RegEntryTypes<T>
    ): LiveEntryTypes<T>;
};

export abstract class SerUtil {
    // These functions are just generally pretty useful!

    /*
     * Handles the intake of integrated items.
     * Note that this creates an UNRESOLVED REF, meaning that it may or not exist until we actually attempt to load this item.
     * This reference will exist until the item is saved for the first time, which will override the ref to an actual item ref.
     */
    public static unpack_integrated_refs(integrated?: string[]): RegRef<any>[] {
        return (integrated || []).map(i => ({
            id: i,
            type: null,
            is_unresolved_mmid: true,
        }));
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
    public static ref_all<T extends EntryType>(
        items: Array<T extends EntryType ? LiveEntryTypes<T> : RegEntry<any>>
    ): RegRef<T>[] {
        return items.map(
            i =>
                ({
                    id: i.RegistryID,
                    is_unresolved_mmid: false, // It's from a live entry type
                    type: i.Type,
                } as RegRef<T>)
        ); // This type coercion is dumb but necessary in case they give us some really weird type
    }

    // Makes our save code look more consistent
    public static async save_all<S>(items: Array<RegEntry<any> | RegSer<S>>): Promise<S[]> {
        return Promise.all(items.map(i => i.save()));
    }

    // Makes our save code look more consistent, and this one avoids async calls
    public static sync_save_all<S, T extends { save(): S }>(items: T[]): S[] {
        return items.map(i => i.save());
    }

    // Handle null -> undef convrsion
    public static sync_save_all_opt<S, T extends { save(): S }>(
        items: T[] | null
    ): S[] | undefined {
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
        provided: string
    ): T {
        let choices = this.list_enum(enum_);
        return this.restrict_choices(choices, default_choice, provided);
    }

    // Some simple helpers. Doing generic solutions on these ended up being too much of a pain to justify it
    public static process_ranges(ranges?: IRangeData[]): Range[] {
        return (ranges || []).map(r => new Range(r));
    }

    public static process_damages(damages?: RegDamageData[]): Damage[] {
        return (damages || []).map(r => new Damage(r));
    }

    public static process_synergies(synergies?: ISynergyData[]): Synergy[] {
        return (synergies || []).map(r => new Synergy(r));
    }

    public static process_actions(actions?: IActionData[]): Action[] {
        return (actions || []).map(a => new Action(a));
    }

    public static process_bonuses(bonuses: IBonusData[] | undefined, source: string): Bonus[] {
        return (bonuses || []).map(b => new Bonus(b, source));
    }

    // Because this is so common, we abstract it to here. Shouldn't try to do this for all of them
    public static process_counters(counters?: RegCounterData[]): Counter[] {
        return counters?.map(c => new Counter(c)) || [];
    }

    // Handles the bonuses, actions, synergies, deployables, but not tags, of an item
    public static async save_commons(x: {
        Bonuses: Bonus[];
        Actions: Action[];
        Synergies: Synergy[];
        Deployables: Deployable[] /*Tags: TagInstance[]*/;
    }): Promise<{
        bonuses: IBonusData[];
        actions: IActionData[];
        synergies: ISynergyData[];
        deployables: RegRef<EntryType.DEPLOYABLE>[];
        /*tags: RegTagInstanceData[] */
    }> {
        return {
            actions: SerUtil.sync_save_all(x.Actions),
            bonuses: SerUtil.sync_save_all(x.Bonuses),
            synergies: SerUtil.sync_save_all(x.Synergies),
            deployables: SerUtil.ref_all(x.Deployables),
            /* tags: await SerUtil.save_all(x.Tags),*/
        };
    }

    // Handles the bonuses, actions, synergies, deployables, but not tags, of an item
    public static async load_basd(
        reg: Registry,
        src: {
            bonuses?: IBonusData[];
            actions?: IActionData[];
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
        }
    ): Promise<void> {
        target.Actions = SerUtil.process_actions(src.actions);
        target.Bonuses = SerUtil.process_bonuses(src.bonuses, target.Name ?? "");
        target.Synergies = SerUtil.process_synergies(src.synergies);
        target.Deployables = await reg.resolve_many(target.OpCtx, src.deployables);
        // target.Tags = await SerUtil.process_tags(reg, src.tags);
    }

    // Hopefully should mitigate a lot of the code duplication I've had floating around
    // Handles the bonuses, actions, synergies, deployables, and tags of an item
    public static async unpack_basdt(
        src: {
            bonuses?: IBonusData[];
            actions?: IActionData[];
            synergies?: ISynergyData[];
            deployables?: PackedDeployableData[];
            tags?: PackedTagInstanceData[];
        },
        reg: Registry,
        ctx: OpCtx
    ): Promise<{
        bonuses: IBonusData[];
        actions: IActionData[];
        synergies: ISynergyData[];
        deployables: RegRef<EntryType.DEPLOYABLE>[];
        tags: RegTagInstanceData[];
    }> {
        // Create deployable entries
        let dep_entries = await SerUtil.unpack_children(
            Deployable.unpack,
            reg,
            ctx,
            src.deployables
        );
        let deployables = SerUtil.ref_all(dep_entries);

        // Get tags
        let tags = src.tags?.map(TagInstance.unpack_reg) ?? [];

        return {
            actions: src.actions ?? [],
            bonuses: src.bonuses ?? [],
            synergies: src.synergies ?? [],
            deployables,
            tags,
        };
    }

    // Tags are also an exception I'm willing to make. These should ___maybe___ be moved to their respective classes, but for convenience we keeping here.
    // A typescript wiz could probably abstract it somehow
    public static async process_tags(
        reg: Registry,
        ctx: OpCtx,
        tags: RegTagInstanceData[] | undefined
    ): Promise<TagInstance[]> {
        let real_tags = tags?.map(c => new TagInstance(reg, ctx, c)) || [];
        await this.all_ready(real_tags);
        return real_tags;
    }

    // We almost never have synced data
    public static unpack_counters_default(counters?: PackedCounterData[]): RegCounterData[] {
        return counters?.map(c => Counter.unpack(c)) || [];
    }

    // Awaitable for all items to be ready
    public static async all_ready(items: Array<RegSer<any> | RegEntry<any>>): Promise<void> {
        await Promise.all(items.map(i => i.ready() as Promise<any>)); // Since these promises self return we need to basically just ignore their type to avoid clashes.
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
    private _load_promise: Promise<any>;

    // Setup
    constructor(registry: Registry, ctx: OpCtx, data: SourceType) {
        this.Registry = registry;
        this.OpCtx = ctx;
        this._load_promise = this.load(data);
    }

    // Async ready check
    public async ready(): Promise<this> {
        await this._load_promise;
        return this;
    }

    // Populate this item with stuff
    protected abstract async load(data: SourceType): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<SourceType>;
}

// Serialization and deserialization requires a registry
// Also, this item itself lives in the registry
export abstract class RegEntry<T extends EntryType> {
    public readonly Type: T;
    public readonly RegistryID: string;
    public readonly Registry: Registry;
    public readonly OpCtx: OpCtx;
    private _load_promise: Promise<any>;

    // This constructor assumes that we've already got an entry in this registry.
    // If we don't, then just temporarily fool this item into thinking we do by giving a fake id then changing it via any (note: this is spooky. make sure you imp right)
    constructor(type: T, registry: Registry, ctx: OpCtx, id: string, reg_data: RegEntryTypes<T>) {
        this.Type = type;
        this.Registry = registry;
        this.RegistryID = id;
        this.OpCtx = ctx;

        // Load
        this._load_promise = this.load(reg_data);
    }
    // Async ready check
    public async ready(): Promise<this> {
        await this._load_promise;
        return this;
    }

    // Make a reference to this item
    public as_ref(): RegRef<T> {
        return {
            id: this.RegistryID,
            type: this.Type,
            is_unresolved_mmid: false, // We're in a reg! we're gooood!
        };
    }

    // Populate this item with stuff
    protected abstract async load(data: RegEntryTypes<T>): Promise<void>;

    // Export this item for registry saving back to registry
    public abstract async save(): Promise<RegEntryTypes<T>>;

    // Convenience function to update self in registry. Note that this doesn't read first!
    public async writeback(): Promise<void> {
        await this.Registry.get_cat(this.Type).update((this as unknown) as LiveEntryTypes<T>); // please don't make me regret this
    }

    // Convenience function to delete self in registry. Note that you should probably stop using this item afterwards!
    // TODO: Cleanup children? Need some sort of refcounting, maybe.
    public async destroy_entry(): Promise<void> {
        // Remove self from ctx first.
        this.OpCtx.delete(this.RegistryID);

        // Then actually destroy
        await this.Registry.get_cat(this.Type).delete_id(this.RegistryID);
    }

    // Convenience function to load this item as a live copy again. Null occurs if the item was destroyed out from beneath us
    // Generates a new opctx
    public async refreshed(): Promise<LiveEntryTypes<T> | null> {
        return this.Registry.get_cat(this.Type).get_live(new OpCtx(), this.RegistryID); // new opctx to refresh _everything_
    }

    // List all child items of this item. We assume none by default
    public get_child_entries(): RegEntry<any>[] {
        return [];
    }

    // List all child items recursively via simple bfs
    public get_child_entries_recursive(): RegEntry<any>[] {
        let all: RegEntry<any>[] = [];
        let frontier: RegEntry<any>[] = [this];
        while (frontier.length) {
            // Fetch and store next item
            let next = frontier.pop()!;
            if (next !== this) {
                all.push(next);
            }

            // Crawl its children. We could make this a recursive function but it really doesn't matter
            frontier.push(...next.get_child_entries());

            // Sanity check
            if (all.length > 5000) {
                throw new Error("Something has gone wrong in the item dependency chain");
            }
        }

        // That's it
        return all;
    }

    // Repack this item. Can oftentimes just be save() with a few minor tweaks. Used for ccio.
    public async pack(): Promise<PackedEntryTypes<T>> {
        return {} as any;
        // TODO
    }

    // Create a copy self in the target DB, bringing along all child items with properly reconstructed links.
    // Returns said copy
    public async insinuate(to_new_reg: Registry): Promise<LiveEntryTypes<T>> {
        // The public expore of insinuate, which ensures it is safe by refreshing before and after all operations
        let fresh = await this.refreshed();
        // If not fresh, implying deleted  while we try to insinuate, we abort the operation
        if (!fresh) {
            throw new Error("Cannot insinuate a deleted item: undefined behavior");
        }

        // After refresh, destroy the opctx cache to be reconstructed as we build below
        await (fresh as RegEntry<any>).insinuate_imp(to_new_reg, true);

        // We do not want fresh itself. Instead, re-fetch fresh from the new registry
        let fresher = (await fresh.refreshed()) as LiveEntryTypes<T>;
        return fresher;
    }

    // Note that since a live copy is always a mere reflection of the underlying reg data, this has no effect on the original reg
    // In order to properly resettle children, we require valid implementations of get_child_entries
    private is_insinuating = false;
    protected async insinuate_imp(to_new_reg: Registry, root_call: boolean): Promise<void> {
        // Check if we've been hit to avoid spurious copying
        if (this.is_insinuating) {
            return;
        }
        this.is_insinuating = true;

        // Ask all of our live children to insinuate themselves. They shall insinuate recursively
        for (let child of this.get_child_entries()) {
            await child.insinuate_imp(to_new_reg, false); // Ensure that they don't get root call true. This prevents dumb save-thrashing
        }

        // To do ourself is quite simple once this is done. Now that all of our child data is in the new registry, we simply transfer ourself via save/load
        // We change our registry before saving, in order to more reliably catch weird saving reg interaactions
        // This is the only situation in which the Registry or RegistryID of a live object can change
        (this as any).Registry = to_new_reg;
        let saved = ((await this.save()) as unknown) as RegEntryTypes<T>;

        // Create an entry with the saved data. We assume that the saved data will be the same as the data used to create - this is by definition true, though our types don't specifically validate that
        let new_entry = await to_new_reg.create(this.Type, this.OpCtx, saved);

        // Update our ID now as well, since it has been decided by the registry. This only really matters to make the outer _refreshed()_ call work better
        (this as any).RegistryID = new_entry.RegistryID;

        // In cases of Non-DAG heirarchies (the only example of which I can think of being Mechs knowing their Pilot and perhaps deployables knowing their deployer),
        // this simplistic approach will unfortunately leave us with some possibly unmaintained references... A possible solution is to re-propagate the update function back through the chain
        // to make sure that everything saved properly. We do this here - Need specific test cases to validate it is working
        if (root_call) {
            // No more processing is going to occur, so links/refs can be stably saved
            for (let i of this.get_child_entries_recursive()) {
                await i.writeback();
                i.is_insinuating = false;
            }
            this.is_insinuating = false;
        }
    }
}

export abstract class InventoriedRegEntry<T extends EntryType> extends RegEntry<T> {
    // Pretty simple
    constructor(type: T, registry: Registry, ctx: OpCtx, id: string, reg_data: RegEntryTypes<T>) {
        super(type, registry, ctx, id, reg_data);
    }

    // What does this item own? We ask our reg for another reg, trusting in the uniquness of nanoid's to keep us in line
    get_inventory(): Registry {
        let v = this.Registry.get_inventory(this.RegistryID);
        if (!v) {
            console.error(
                `Couldn't lookup inventory registry for item ${this.Type}:${this.RegistryID}`
            );
            return this.Registry;
        }
        return v;
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
    raw: RegEntryTypes<T>
) => LiveEntryTypes<T>;

// This class deduplicates circular references by ensuring that any `resolve` calls can refer to already-instantiated objects wherever possible
export class OpCtx {
    // We rely entirely on no collisions here
    private resolved: Map<string, any> = new Map(); // Maps lookups with a key in a specified registry to their results
    // private pending: {[key: number]: Array<() => any>} = {};
    private pending = 0;

    get(id: string): RegEntry<any> | null {
        return this.resolved.get(id) ?? null;
        }

    // Tell the ctx that we resolved <ref> as <val>
    set(id: string, val: RegEntry<any>) {
        // Make the reg entry if not there
        this.resolved.set(id, val);
        }

    // A helper on set. Has finicky behavior on mmid resolution. Doesn't overwrite
    add(item: RegEntry<any>) {
        this.set(item.RegistryID, item);
    }

    // Removes a quantity from a ctx, e.g. in case of deletion or migration (? not sure on migration. they maybe need to re-create selves????)
    delete(id: string) {
        this.resolved.delete(id);
    }
            }
        }
    }
}

export abstract class RegCat<T extends EntryType> {
    // Need this to key them because we can't really identify otherwise
    cat: T;

    // Creation func needed to create live entries from reg entries
    revive_func: ReviveFunc<T>;

    // Need this for like, basically everything
    parent: Registry;

    constructor(parent: Registry, cat: T, creator: ReviveFunc<T>) {
        this.parent = parent;
        this.cat = cat;
        this.revive_func = creator;
    }

    // Find a value by mmid
    abstract async lookup_mmid(ctx: OpCtx, mmid: string): Promise<LiveEntryTypes<T> | null>;

    // Fetches the specific raw item of a category by its ID
    abstract async get_raw(id: string): Promise<RegEntryTypes<T> | null>;

    // Fetches all raw items of a category
    abstract async list_raw(): Promise<Array<RegEntryTypes<T>>>;

    // Instantiates a live interface of the specific raw item. Convenience wrapper
    abstract async get_live(ctx: OpCtx, id: string): Promise<LiveEntryTypes<T> | null>;

    // Fetches all live items of a category. Little expensive but fine when you really need it, e.g. when unpacking
    abstract async list_live(ctx: OpCtx): Promise<Array<LiveEntryTypes<T>>>;

    // Save the given live item, propagating any changes made to it to the backend data source
    // Do NOT attempt to feed this items foreign to this cat
    abstract async update(...items: LiveEntryTypes<T>[]): Promise<void>;

    // Delete the given id in the given category. Return deleted item, or null if not found
    abstract async delete_id(id: string): Promise<RegEntryTypes<T> | null>;

    // Create a new entry(s) in the database with the specified data. Generally, you cannot control the output ID
    // The awaited item should be .,ready
    abstract async create_many_live(
        ctx: OpCtx,
        ...vals: Array<RegEntryTypes<T>>
    ): Promise<LiveEntryTypes<T>[]>;

    // A simple singular form if you don't want to mess with arrays
    // The awaited item should be .ready
    async create_live(ctx: OpCtx, val: RegEntryTypes<T>): Promise<LiveEntryTypes<T>> {
        let vs = await this.create_many_live(ctx, val);
        return vs[0];
    }

    // For when you don't need a live
    abstract async create_many_raw(...vals: Array<RegEntryTypes<T>>): Promise<RegRef<T>[]>;

    async create_raw(val: RegEntryTypes<T>): Promise<RegRef<T>> {
        return (await this.create_many_raw(val))[0];
    }

    // Create a new entry in the database with the creation func's default data. Generally, you cannot control the output ID
    abstract async create_default(ctx: OpCtx): Promise<LiveEntryTypes<T>>;
}

export abstract class Registry {
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
    public async create<T extends EntryType>(
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

    // Delete an item, by cat + id. Just delegates through get_cat
    public async delete(cat: EntryType, id: string) {
        this.get_cat(cat).delete_id(id);
    }

    // In theory should never fail because of type bounding, so long as all cats were loaded that is
    public get_cat<T extends EntryType>(cat: T): RegCat<T> {
        return this.try_get_cat(cat) as RegCat<T>;
    }

    // Fetch the specified category or error if it doesn't exist
    private try_get_cat(cat: string): RegCat<any> | null {
        let v = this.cat_map.get(cat as EntryType);
        if (!v) {
            console.error(`Error: Category "${cat}" does not exist`);
            return null;
        }
        return v;
    }

    // A bit cludgy, but looks far and wide to find things with the given id(s), yielding the first match of each.
    // Implementation of this is a bit weird, as this would usually mean that you DON'T want to look in the current registry
    // As such its implementation is left up to the user.
    public async resolve_wildcard_mmid(ctx: OpCtx, mmid: string): Promise<RegEntry<any> | null> {
        // Pre-Check ctx for a hit. Saves time given the laborious nature of this search
        let pre = ctx.get(this, mmid);
        if (pre) {
            return pre;
        }

        // Otherwise we go a-huntin in all of our categories
        for (let cat of this.cat_map.values()) {
            let attempt = await cat.lookup_mmid(ctx, mmid);
            if (attempt) {
                // We found it!
                return attempt;
            }
        }

        // It is unfindable
        return null;
    }

    // These functions are identical. Just typing distinctions so we can generally reason that typed RegRefs will produce the corresponding live entry type
    // Find the item corresponding to this ref
    public async resolve<T extends EntryType>(
        ctx: OpCtx,
        ref: RegRef<T>
    ): Promise<LiveEntryTypes<T> | null> {
        return this.resolve_rough(ctx, ref) as any; // Trust me bro
    }

    // This function (along with resolve_wildcard_mmid) actually performs all of the resolution of references
    public async resolve_rough(ctx: OpCtx, ref: RegRef<any>): Promise<RegEntry<any> | null> {
        // Haven't resolved this yet
        let result: RegEntry<any> | null;
        if (ref.is_unresolved_mmid) {
            if (ref.type) {
                result = await this.try_get_cat(ref.type)?.lookup_mmid(ctx, ref.id);
            } else {
                result = await this.resolve_wildcard_mmid(ctx, ref.id);
            }
        } else {
            result = await this.get_cat(ref.type!).get_live(ctx, ref.id);
        }

        return result;
    }

    // Similar to resolve above, this is just for type flavoring basically
    public async resolve_many<T extends EntryType>(
        ctx: OpCtx,
        refs: RegRef<T>[] | undefined
    ): Promise<Array<LiveEntryTypes<T>>> {
        return this.resolve_many_rough(ctx, refs) as any; // bro trust me
    }

    // Resolves as many refs as it can. Filters null results. Errors naturally on invalid cat
    public async resolve_many_rough(
        ctx: OpCtx,
        refs: RegRef<EntryType>[] | undefined
    ): Promise<Array<RegEntry<any>>> {
        if (!refs) {
            return [];
        }
        let resolves = await Promise.all(refs.map(r => this.resolve_rough(ctx, r)));
        resolves = resolves.filter(d => d != null);
        return resolves as RegEntry<any>[]; // We filtered the nulls
    }

    // Returns the inventory registry of the specified id. Doesn't really matter how you implement this, really
    public abstract get_inventory(for_item_id: string): Registry | null;

    // Return true if this registry is the same as the specified. Useful in case the registry is simply a thin visor which we might end up with multiple copies of
    public abstract is(other: Registry): boolean;

    // Creates an inventory for the specified id.
    // public abstract get_inventory(for_item_id: string): Promise<Registry | null>;

    // Deletes an inventory for the specified id
}

// "Refs" handle cross referencing of entries, and is used to establish ownership and heirarchy in static data store (where normal js refs dont' really work)
// Usually, a ref has a specific type. For instance, a reference to a weapon would be a RegRef<EntryType.MECH_WEAPON>. They can/should be resolved via the `resolve` or `resolve_many` functions.
// Sometimes we do not know the type. These are typed as RegRef<any>. Generally trying to `resolve` these gives wonky typing, so I would advise using `resolve_rough` and `resolve_many_rough`
//
// Sometimes, we don't even know the item's actual unique registry-id, and instead only know the compcon-provided id. Slightly perplexingly, I decided to call these "mmid"s. I don't remember why. Just roll with it
// These are typically encountered only on freshly unpacked daata, and provide a means of navigating tricky chicken-egg scenarios by leaving the references unresolved until the items are first loaded.
// For the most part every rough ref is an unresolved mmid, though there are certain cases where theoretically one might simply not know the type of
// Use rough basically only when you cannot be explicit about the type, IE for unresolved mmids
// If mmid is resolved but you have a mixed content array, might still be / definitely is better to just use `any`
export interface RegRef<T extends EntryType> {
    // The item id
    id: string;

    // The category we are referencing. If null, it is unknown (only used for unresolved mmids - avoid if possible)
    type: T | null;

    // Is our ID like, the actual id, or just like "DRAKE" or some shit
    is_unresolved_mmid: boolean;
}

export function quick_mm_ref<T extends EntryType>(type: T | null, mmid: string): RegRef<T> {
    return {
        id: mmid,
        type: type as T | null,
        is_unresolved_mmid: true,
    };
}
