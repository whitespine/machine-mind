import { Frame, MechSystem, MechLoadout, MechWeapon, PilotWeapon, WeaponMount, Reserve, Skill, Talent, License, Mech, PilotArmor, PilotGear, Deployable, WeaponMod, Faction, CoreBonus, Organization, Pilot, PilotLoadout } from "@src/class";
import { PackedPilotLoadoutData, PackedMechData, PackedFactionData, PackedMechLoadoutData, PackedMechSystemData, PackedMechWeaponSaveData, PackedMountData, PackedPilotEquipmentState, PackedReserveData, PackedPilotData, PackedEquipmentData, PackedSkillData, PackedOrganizationData } from "@src/interface";
import { EntryType, LiveEntryTypes, RegCat, Registry, RegRef } from "@src/registry";

export interface IImageContainer {
    SetLocalImage(): any;
    SetCloudImage(): any;
    Image: string;
}

export interface IDiceStats {
    min: number;
    max: number;
    mean: number;
    error: boolean;
    diceString: string;
}

export interface Id20RollResult {
    total: number;
    rawDieRoll: number;
    staticBonus: number;
    accuracyDiceCount: number; // net accuracy dice total - negative if at disadvantage
    rawAccuracyRolls: number[]; // results of each accuracy/disadvantage die
    accuracyResult: number;
}

export interface IDamageRollResult {
    diceString: string;
    total: number;
    rawDieRolls: number[];
    staticBonus: number;
    parseError: boolean;
}

export interface PackedRankedData {
    id: string;
    rank: number;
    custom?: boolean;
    custom_desc?: string;
    custom_detail?: string;
}
export interface IMechState {
    active_mech_id: string,
    stage: string,
    turn: number,
    actions: number,
    braced: boolean,
    overcharged: boolean,
    prepare: boolean,
    bracedCooldown: boolean,
    redundant: boolean,
    mounted: boolean,
    stats: {
        moves: number,
        kills: number,
        damage: number,
        hp_damage: number,
        structure_damage: number,
        overshield: number,
        heat_damage: number,
        reactor_damage: number,
        overcharge_uses: number,
        core_uses: number
    },
    deployed: []
}
export interface IHistoryItem {
    field: string;
    val?: any;
}

// Describes an itemized transfer as part of an insinuation. Used in hooks
export interface MidInsinuationRecord<T extends EntryType> {
    type: T;
    from: RegRef<T>; // Ref to entry this was insinuated from
    // The intermediate product, which has been achieved by telling the original item that it lives elsewhere than where it came from
    // This item is, at the time of this object being yielded, about to be written to the destination registry. Making any final changes here, while you can
    pending: LiveEntryTypes<T>;
}
export interface InsinuationRecord<T extends EntryType> {
    type: T;
    from: RegRef<T>; // Ref to entry this was insinuated from
    new_item: LiveEntryTypes<T>; // The final product, newly insinuated into its registry
}

// Note: Registrys can have these inbuilt. They will be called after the function-call-specific insinuate hooks if present

// Shorthand for the relinker type of _InsinuateHooks. Useful for function factories
export type RelinkHook<T extends EntryType> = (
    source_item: LiveEntryTypes<T>,
    dest_reg: Registry,
    dest_cat: RegCat<T>
) => Promise<LiveEntryTypes<T> | null> | LiveEntryTypes<T> | null;
interface _InsinuateHooks {
    // Used during insinuation procedures to dedup/consolidate entities by finding pre-existing entities to use instead (or overriding entity creation process
    relinker<T extends EntryType>(
        source_item: LiveEntryTypes<T>,
        dest_reg: Registry,
        dest_cat: RegCat<T>
    ): Promise<LiveEntryTypes<T> | null> | LiveEntryTypes<T> | null;
    skip_relinked_inventories?: boolean; // Default faulse. If true, we will not attempt to insinuate inventory items if the Inventoried actor entry was relinked

    /* Hook called upon completion of an insinuation. 
     * Provided with information about the old and new item

     * Note that the 2nd/3rd args are derived from the item, and are simply there for convenience
     */
    post_final_write<T extends EntryType>(
        record: InsinuationRecord<T>,
        dest_reg: Registry,
        dest_cat: RegCat<T>
    ): Promise<void> | void;

    /* Hook called upon insinuation targets immediately prior to their final write to the destination reg.
     * At this points, the entire object structure should be in place, though it has not been committed to memory
     * Overriding this is necessary if we have other requirements in our insinuation process. Edit the object in place.
     * Note that at this point the entry has already been created -- you cannot change anything at this point except what is finally written to the entry.
     *
     * Note that the 2nd/3rd args are derived from the item, and are simply there for convenience
     */
    pre_final_write<T extends EntryType>(
        record: MidInsinuationRecord<T>,
        dest_reg: Registry,
        dest_cat: RegCat<T>
    ): Promise<void> | void;
}

// Let all the functions be optional
export type InsinuateHooks = Partial<_InsinuateHooks>;

interface _SyncHooks {
    // We call these immediately prior to writing back any item written / encountered by this sync
    // Pre-existing items that are ignored/unaffected by the merge will in general be unaffected by the sync
    // - This will only occur for deployables associated with items from this import

    // The callbacks should edit the first argument in place before it is saved. Note that the packed data is provided for reference - edits to it will do nothing
    // - If is_new is specified, then that item was just created/insinuated
    // 
    // pre_sync_save<T extends EntryType>(item: LiveEntryTypes<T>, is_new: boolean): Promise<void> | void;

    // Items are processed innermost -> outermost. So, weapons before mounts before loadouts before mechs
    sync_pilot(item: Pilot, from_raw: PackedPilotData, is_new: boolean): Promise<void> | void;
    sync_mech(item: Mech, from_raw: PackedMechData, is_new: boolean): Promise<void> | void;
    sync_mech_weapon(item: MechWeapon, from_raw: PackedMechWeaponSaveData, is_new: boolean): Promise<void> | void;
    sync_mech_system(item: MechSystem, from_raw: PackedEquipmentData, is_new: boolean): Promise<void> | void;
    sync_frame(item: Frame, from_raw: PackedMechData , is_new: boolean): Promise<void> | void; // raw is just an id. we don't get a lot to go on here
    sync_core_bonus(item: CoreBonus, from_raw: PackedPilotData , is_new: boolean): Promise<void> | void; // raw is just an id, so we provide full pilot as context. Maybe it'll help more, idk
    sync_pilot_weapon(item: PilotWeapon, from_raw: PackedPilotEquipmentState, is_new: boolean): Promise<void> | void;
    sync_pilot_armor(item: PilotArmor, from_raw: PackedPilotEquipmentState, is_new: boolean): Promise<void> | void;
    sync_pilot_gear(item: PilotGear, from_raw: PackedPilotEquipmentState, is_new: boolean): Promise<void> | void;
    sync_loadout(item: MechLoadout, from_raw: PackedMechLoadoutData, is_new: boolean): Promise<void> | void;
    sync_pilot_loadout(item: PilotLoadout, from_raw: PackedPilotLoadoutData, is_new: boolean): Promise<void> | void;
    sync_weapon_mount(item: WeaponMount, from_raw: PackedMountData, is_new: boolean): Promise<void> | void; // here is your chance to get mounts as well
    sync_weapon_mod(item: WeaponMod, from_raw: PackedEquipmentData, is_new: boolean): Promise<void> | void; // here is your chance to get mounts as well
    sync_reserve(item: Reserve, from_raw: PackedReserveData, is_new: boolean): Promise<void> | void;
    // sync_faction(item: Faction, from_raw: PackedFactionData, is_new: boolean): Promise<void> | void;
    sync_organization(item: Organization, from_raw: PackedOrganizationData, is_new: boolean): Promise<void> | void;
    sync_trigger(item: Skill, from_raw: PackedPilotData["skills"][0], is_new: boolean): Promise<void> | void;
    sync_talent(item: Talent, from_raw: PackedRankedData, is_new: boolean): Promise<void> | void;
    sync_license(item: License, from_raw: PackedRankedData, is_new: boolean): Promise<void> | void;

    // This callback is unique. it is called for any deployables attached to items affected by this synchronization process.
    // It does NOT automatically writeback - do it yourself in this callback if you really waant to
    sync_deployable_nosave(item: Deployable): Promise<void> | void;
}

// Type for pilot/mech syncs
export type SyncHooks = Partial<_SyncHooks>;

export type AllHooks = SyncHooks & InsinuateHooks