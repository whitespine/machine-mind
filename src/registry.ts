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
    NpcClass,
    Npc,
    NpcFeature,
    NpcTemplate,
    Organization,
} from "@src/class";
import { trimmed } from "./classes/key_util";
import {
    IActionData,
    IBonusData,
    IEnvironmentData,
    IFactionData,
    IOrganizationData,
    IRangeData,
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
    PackedNpcClassData,
    PackedNpcFeatureData,
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
    RegNpcClassData,
    RegNpcData,
    RegNpcFeatureData,
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

type _RegTypeMap = { [key in EntryType]: object };
// What our registries hold
export interface FixedRegEntryTypes extends _RegTypeMap {
    // [EntryType.CONDITION]: IStatusData;
    [EntryType.CORE_BONUS]: RegCoreBonusData;
    [EntryType.DEPLOYABLE]: RegDeployableData;
    [EntryType.ENVIRONMENT]: IEnvironmentData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: RegFrameData;
    [EntryType.LICENSE]: RegLicenseData;
    [EntryType.MANUFACTURER]: RegManufacturerData;
    [EntryType.MECH]: RegMechData;
    [EntryType.MECH_SYSTEM]: RegMechSystemData;
    [EntryType.MECH_WEAPON]: RegMechWeaponData;
    [EntryType.NPC]: RegNpcData;
    [EntryType.NPC_CLASS]: RegNpcClassData;
    [EntryType.NPC_FEATURE]: RegNpcFeatureData;
    [EntryType.NPC_TEMPLATE]: RegNpcTemplateData;
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
    [EntryType.DEPLOYABLE]: PackedDeployableData;
    [EntryType.ENVIRONMENT]: IEnvironmentData;
    [EntryType.FACTION]: IFactionData;
    [EntryType.FRAME]: PackedFrameData;
    [EntryType.LICENSE]: null;
    [EntryType.MANUFACTURER]: PackedManufacturerData;
    [EntryType.MECH]: PackedMechData;
    [EntryType.MECH_SYSTEM]: PackedMechSystemData;
    [EntryType.MECH_WEAPON]: PackedMechWeaponData;
    [EntryType.NPC_CLASS]: PackedNpcClassData;
    [EntryType.NPC_FEATURE]: PackedNpcFeatureData;
    [EntryType.NPC_TEMPLATE]: PackedNpcTemplateData;
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
     * We assume they come from the compendium
     */
    public static unpack_integrated_refs(reg: Registry, integrated?: string[]): RegRef<any>[] {
        return (integrated || []).map(i => quick_local_ref(reg, null, i));
    }
    
    // Just deals with potential nulls
    public static unpack_tag_instances(reg: Registry, tags?: PackedTagInstanceData[]): RegTagInstanceData[] {
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
    public static ref_all<T extends EntryType>(
        items: Array<RegEntry<T>>
    ): RegRef<T>[] {
        return items.map(i => i.as_ref());
    }

    // Makes our save code look more consistent
    public static save_all<S, T extends { save(): S }>(items: T[]): S[] {
        return items.map(i => i.save());
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
    public static save_commons(x: {
        Bonuses: Bonus[];
        Actions: Action[];
        Synergies: Synergy[];
        Deployables: Deployable[] /*Tags: TagInstance[]*/;
    }): {
        bonuses: IBonusData[];
        actions: IActionData[];
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
        let tags = SerUtil.unpack_tag_instances(reg, src.tags);

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

    public static chunk_string(id_string: string): string {
        return id_string.replace(/(\s|\/|-)+/g, "_").toLowerCase();
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
    public readonly OrigData: any; // What was loaded for this reg-entry. Is copied back out on save(), but will be clobbered by any conflicting fields. We make no suppositions about what it is
    private _load_promise: Promise<any>;

    // Setup
    constructor(registry: Registry, ctx: OpCtx, data: SourceType) {
        this.Registry = registry;
        this.OpCtx = ctx;
        this.OrigData = data;

        // Load, and when done remove our pending entry
        this._load_promise = this.load(data);
    }

    // Async ready check
    public async ready(): Promise<this> {
        await this._load_promise;
        return this;
    }

    // Populate this item with stuff
    protected abstract load(data: SourceType): Promise<void>;

    // Export this item for registry saving back to registry
    public save(): SourceType {
        return { ...this.OrigData, ...this.save_imp() };
    }

    protected abstract save_imp(): SourceType;
}

// Describes an itemized transfer as part of an insinuation
export interface InsinuationRecord<T extends EntryType> {
    type: T;
    old_item: LiveEntryTypes<T>;
    new_item: LiveEntryTypes<T>;
}

// Serialization and deserialization requires a registry
// Also, this item itself lives in the registry
export abstract class RegEntry<T extends EntryType> {
    public readonly Type: T;
    public readonly RegistryID: string;
    public readonly Registry: Registry;
    public readonly OpCtx: OpCtx;
    public readonly OrigData: any; // What was loaded for this reg-entry. Is copied back out on save(), but will be clobbered by any conflicting fields. We make no suppositions about what it is
    private _load_promise: Promise<any>;

    // This constructor assumes that we've already got an entry in this registry.
    // If we don't, then just temporarily fool this item into thinking we do by giving a fake id then changing it via any (note: this is spooky. make sure you imp right)
    constructor(type: T, registry: Registry, ctx: OpCtx, id: string, reg_data: RegEntryTypes<T>) {
        this.Type = type;
        this.Registry = registry;
        this.OpCtx = ctx;
        this.RegistryID = id;
        this.OrigData = reg_data;
        ctx.set(id, this);

        // Load, and when done remove our pending entry
        this._load_promise = this.load(reg_data);
    }
    // Async ready check
    public async ready(): Promise<this> {
        await this._load_promise;
        return this;
    }

    // Make a reference to this item
    public as_ref(as_mmid: boolean = false): RegRef<T> {
        // If our context was set as mmid-mode, then we save back as ids whenever possible
        if (as_mmid) {
            let mmid = (this as any).id ?? (this as any).name?.toLowerCase() ?? "MISSING_MMID";
            return {
                id: mmid,
                is_unresolved_mmid: true,
                type: this.Type,
                reg_name: this.Registry.name()
            };
        } else {
            return {
                id: this.RegistryID,
                type: this.Type,
                is_unresolved_mmid: false, // We're in a reg! we're gooood!
                reg_name: this.Registry.name()
            };
        }
    }

    // Populate this item with stuff
    protected abstract load(data: RegEntryTypes<T>): Promise<void>;

    // Export this item for registry saving back to registry
    public save(): RegEntryTypes<T> {
        let savedata = this.save_imp();
        return { ...this.OrigData, ...savedata }; // TODO: do more of a recursive merge
    }

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
        this.OpCtx.delete(this.RegistryID);

        // Then actually destroy
        await this.Registry.get_cat(this.Type).delete_id(this.RegistryID);
    }

    // Convenience function to load this item as a live copy again. Null occurs if the item was destroyed out from beneath us
    // Generates a new opctx if none is provided, otherwise behaves just like getLive() on this items reg
    public async refreshed(ctx?: OpCtx): Promise<LiveEntryTypes<T> | null> {
        return this.Registry.get_cat(this.Type).get_live(ctx ?? new OpCtx(), this.RegistryID); // new opctx to refresh _everything_
    }

    // List all associated items of this item. We assume none by default
    // Note that this is NOT the inventory of an item. It is instead a listing of items that must be brought along if this item is moved
    // Most notably: Integrated systems, weapons, and deployables
    public get_assoc_entries(): RegEntry<any>[] {
        return [];
    }

    // Create a copy self in the target DB, bringing along all child items with properly reconstructed links.
    // Returns said copy. If supplied, ctx will be used for the revival of the newly insinuated data in to_new_reg.
    // This can be the same ctx as the original without issue, but doing so is pretty unlikely to be useful
    public async insinuate(to_new_reg: Registry, ctx?: OpCtx): Promise<LiveEntryTypes<T>> {
        // The public expore of insinuate, which ensures it is safe by refreshing before and after all operations
        let fresh = await this.refreshed();
        // If not fresh, implying deleted  while we try to insinuate, we abort the operation
        if (!fresh) {
            throw new Error("Cannot insinuate a deleted item: undefined behavior");
        }

        // Create a mapping of original items to Insinuation records
        let hitlist: Map<RegEntry<EntryType>, InsinuationRecord<EntryType>> = new Map();
        await (fresh as RegEntry<EntryType>)._insinuate_imp(to_new_reg, hitlist);

        // At this point no more processing is going to occur - our entire data structure should have been transferred over to the new reg
        // However, what _hasn't_ yet been processed / updated are our reg entry references - they're still saved as their original ids
        // So we write all back once more with the new reference structure established
        for (let i of hitlist.keys()) {
            await i.writeback();
        }

        // We do not want `fresh` itself, as its references will be wacky. Instead, re-fetch fresh from the new registry
        let fresher = (await fresh.refreshed(ctx)) as LiveEntryTypes<T>;

        // Trigger post insinuation hook on the new reg for every item
        // One might thing "oh no won't this be expensive?". Nope! The refresh to get `fresher` has already prefetched them to ctx
        for (let record of hitlist.values()) {
            let n = await record.new_item.refreshed(ctx);
            if (!n) {
                console.error(
                    "Something went wrong during insinuation: an item was not actually created properly, or an old item had been deleted."
                );
            }
            record.new_item = n!;
            await to_new_reg.hook_post_insinuate(record);
        }

        return fresher;
    }

    // Note that since a live copy is always a mere reflection of the underlying reg data, this has no effect on the original reg
    // In order to properly resettle children, we require valid implementations of get_child_entries
    // Insinuation hit list is used to track which items are already being insinuated, so as not to get caught in cycles
    // Return value is the temporary new live entry we used to generate the ID. NOTE THAT IT IS NOT MEANT TO BE RETURNED - IT IS SUPER UNSTABLE
    // it is, however, needed for inventoried regs to figure out their new inventory location. Null indicates no insinuation occurred due to circular reference protection
    public async _insinuate_imp(
        to_new_reg: Registry,
        insinuation_hit_list: Map<RegEntry<any>, InsinuationRecord<any>>
    ): Promise<LiveEntryTypes<T> | null> {
        // Check if we've been hit to avoid circular problems
        if (insinuation_hit_list.has(this)) {
            return null;
        }

        // To insinuate this specific item is fairly simple. Just save the data, then create a corresponding entry in the new reg
        // We change our registry before saving as a just-in-case. It shouldn't really matter
        // This is the only situation in which the Registry or RegistryID of a live object can change
        (this as any).Registry = to_new_reg;
        let saved = (this.save() as unknown) as RegEntryTypes<T>;

        // Create an entry with the saved data. This is essentially a duplicate of this item on the other registry
        // however, this new item will (somewhat predictably) fail to resolve any of its references. We don't care - we just want its id
        let new_entry: LiveEntryTypes<T> = await to_new_reg.create_live(
            this.Type,
            this.OpCtx,
            saved
        );

        // Update our ID to mimic the new entry's registry id. Note that we might not be a valid live entry at this point - any number of data integrity issues could happen from this hacky transition
        // Thankfully, all we really need to do is have this ID right / be able to save validly, so the outer insinuate method can make all of the references have the proper id's
        (this as any).RegistryID = new_entry.RegistryID;

        // Mark our new item. Note that this "new_item" will be replaced later with a refreshed copy
        insinuation_hit_list.set(this, {
            new_item: new_entry,
            old_item: this,
            type: this.Type,
        });

        // Ask all of our live children to insinuate themselves. They shall insinuate recursively
        for (let child of this.get_assoc_entries()) {
            await child._insinuate_imp(to_new_reg, insinuation_hit_list); // Ensure that they don't get root call true. This prevents dumb save-thrashing
        }
        return new_entry;
    }

    // Get the session specific data for this item. This is ephemeral and context specific. In foundry, we use it to track the corresponding Foundry Actor/Item
    public get flags(): any | null {
        return this.OpCtx.get_flags(this.RegistryID);
    }

    public set flags(nv: any) {
        this.OpCtx.set_flags(this.RegistryID, nv);
    }
}

export abstract class InventoriedRegEntry<T extends EntryType> extends RegEntry<T> {
    // Pretty simple
    constructor(type: T, registry: Registry, ctx: OpCtx, id: string, reg_data: RegEntryTypes<T>) {
        super(type, registry, ctx, id, reg_data);
    }

    // What does this item own? We ask our reg for another reg, trusting in the uniquness of nanoid's to keep us in line
    get_inventory(): Registry {
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

    // Insinuation logic is a bit different as well
    public async _insinuate_imp(
        to_new_reg: Registry,
        insinuation_hit_list: Map<RegEntry<EntryType>, InsinuationRecord<EntryType>>
    ): Promise<LiveEntryTypes<T> | null> {
        // Get our super call. Since new entry is of same type, then it should also have an inventory
        let new_reg_entry = (await super._insinuate_imp(
            to_new_reg,
            insinuation_hit_list
        )) as InventoriedRegEntry<T> | null;

        // If it went off, then we want to insinuate all items from our inventory to the new regs inventory
        if (new_reg_entry) {
            // Get every item.
            let all_items = this.enumerate_owned_items();

            // Get our new target reg (the new entry's inventory)
            let new_inventory = new_reg_entry.get_inventory();

            // Insinuate them all
            for (let i of all_items) {
                await i._insinuate_imp(new_inventory, insinuation_hit_list);
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
    raw: RegEntryTypes<T>
) => Promise<LiveEntryTypes<T>>;

// This class deduplicates circular references by ensuring that any `resolve` calls can refer to already-instantiated objects wherever possible
export class OpCtx {
    // We rely entirely on no collisions here. Luckily, they are nigh-on impossible with nanoids, and even with foundry's keys at the scale we are using
    private resolved: Map<string, any> = new Map(); // Maps lookups with a key in a specified registry to their results

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

    // Flags are ephemeral data stored on objects, that we would _typically_ expect to be set by RegCats. Entirely optional, just there to provide some flex functionality
    private flags: Map<string, any> = new Map();

    // Sets the flags for a specific item. Flags are ephemeral data stored on objects. (PS: they're pretty useful for foundry)
    public set_flags(for_item_id: string, flag_data: any) {
        this.flags.set(for_item_id, flag_data);
    }

    // Retrieves the flags for a specific item. Flags are ephemeral data stored on objects
    public get_flags(for_item_id: string): any | null {
        if (this.flags.has(for_item_id)) {
            return this.flags.get(for_item_id);
        } else {
            return null;
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
    abstract lookup_mmid(ctx: OpCtx, mmid: string): Promise<LiveEntryTypes<T> | null>;

    // Fetches the specific raw item of a category by its ID
    abstract get_raw(id: string): Promise<RegEntryTypes<T> | null>;

    // Fetches all raw items of a category
    abstract list_raw(): Promise<Array<RegEntryTypes<T>>>;

    // Instantiates a live interface of the specific raw item. Convenience wrapper
    abstract get_live(ctx: OpCtx, id: string): Promise<LiveEntryTypes<T> | null>;

    // Fetches all live items of a category. Little expensive but fine when you really need it, e.g. when unpacking
    abstract list_live(ctx: OpCtx): Promise<Array<LiveEntryTypes<T>>>;

    // Save the given live item, propagating any changes made to it to the backend data source
    async update(...items: LiveEntryTypes<T>[]): Promise<void> {
        let to_save: Array<{ id: string; data: RegEntryTypes<T> }> = [];
        for (let i of items) {
            if (this.cat != i.Type) {
                console.warn("Tried to update an item with an incorrectly typed new live item");
                continue;
            }
            let saved = i.save() as RegEntryTypes<T>; // Unsure why this type assertion is necessary, but oh well
            to_save.push({ id: i.RegistryID, data: saved });
        }
        return this.update_many_raw(to_save);
    }

    // Simpler wrapper around the below
    async update_raw(id: string, data: RegEntryTypes<T>): Promise<void> {
        return this.update_many_raw([{ id, data }]);
    }

    // This method does not do any intrinsic safety checking of if the item already exists - that is the responsibility of the user
    // Do NOT attempt to feed this items foreign to this cat. It has no way of telling.
    abstract update_many_raw(items: Array<{ id: string; data: RegEntryTypes<T> }>): Promise<void>;

    // Delete the given id in the given category. Return deleted item, or null if not found
    abstract delete_id(id: string): Promise<RegEntryTypes<T> | null>;

    // Create a new entry(s) in the database with the specified data. Generally, you cannot control the output ID
    // The awaited item should be .,ready
    abstract create_many_live(
        ctx: OpCtx,
        ...vals: Array<RegEntryTypes<T>>
    ): Promise<LiveEntryTypes<T>[]>;

    // A simple singular form if you don't want to mess with arrays
    // The awaited item should be .ready
    // If trim is specified (which we usually want when unpacking but rarely otherwise), cut off all unexpected keys
    async create_live(
        ctx: OpCtx,
        val: RegEntryTypes<T>,
        trim: boolean = false
    ): Promise<LiveEntryTypes<T>> {
        if (trim) {
            val = trimmed(this.cat, val);
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
        id: string
    ): Promise<LiveEntryTypes<T> | null> {
        return this.get_cat(type).get_live(ctx, id);
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
    public async resolve_wildcard_mmid(ctx: OpCtx, mmid: string): Promise<LiveEntryTypes<EntryType> | null> {
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
    public async resolve_rough(ctx: OpCtx, ref: RegRef<any>): Promise<LiveEntryTypes<EntryType> | null> {
        // Check name
        if(ref.reg_name != this.name()) {
            let appropriate_reg = this.switch_reg(ref.reg_name);
            if(appropriate_reg) {
                return appropriate_reg.resolve_rough(ctx, ref);
            } else {
                return null;
            }
        }

        // Haven't resolved this yet
        let result: LiveEntryTypes<any> | null;
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

    // Resolves as many refs as it can. Filters null results. Errors naturally on invalid cat. Can be of mixed types
    public async resolve_many_rough(
        ctx: OpCtx,
        refs: RegRef<EntryType>[] | undefined
    ): Promise<Array<LiveEntryTypes<EntryType>>> {
        if (!refs) {
            return [];
        }
        let resolves = await Promise.all(refs.map(r => this.resolve_rough(ctx, r)));
        resolves = resolves.filter(d => d != null);
        return resolves as LiveEntryTypes<any>[]; // We filtered the nulls
    }

    // Returns the inventory registry of the specified id. Implementation is highly domain specific - foundry needs specifiers for type _and_ id. In such cases, would recommend compound id, like "actor:123456789"
    public abstract switch_reg(selector: string): Registry | null;

    // Wraps switch_reg. Provides an inventory for the given inventoried unit
    public abstract switch_reg_inv(for_inv_item: InventoriedRegEntry<EntryType>): Registry;

    // Returns the name by which this reg would be fetched via switch_reg
    public abstract name(): string;

    // Hook called upon completion of an insinutation. NOTE: called on the _destination_ reg
    public hook_post_insinuate<T extends EntryType>(
        _record: InsinuationRecord<T>
    ): Promise<void> | void {
        /* override */
    }
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

    // The name of the reg we expect to find this item in. If we cannot resolve this to another reg, we just treat it as though it is expected in the source reg
    reg_name: string;
}

// Quickly make an id-based reference reference
export function quick_local_ref<T extends EntryType>(reg: Registry, type: T | null, mmid: string): RegRef<T> {
    return {
        id: mmid,
        type: type as T | null,
        is_unresolved_mmid: true,
        reg_name: reg.name()
    };
}
