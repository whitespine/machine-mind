import { MechSystem, Mech, MechWeapon, WeaponMod, MechEquipment, Frame } from "@src/class";
import { defaults } from "@src/funcs";
import {
    EntryType,
    OpCtx,
    RegRef,
    RegSer,
    SerUtil,
    SimSer,
} from "@src/registry";
import { FittingSize, MountType, WeaponSize } from "@src/enums";
import { fallback_obtain_ref, FALLBACK_WAS_INSINUATED, RegFallback as RegFallbackStack } from "../regstack";
import { merge_defaults } from "../default_entries";
import { nanoid } from "nanoid";
import { AllHooks, PackedMechData, SyncHooks } from "@src/interface";

//todo: superheavies :<

//////////////////////// PACKED INFO ////////////////////////
export interface PackedEquipmentData {
    id: string;
    destroyed: boolean;
    cascading: boolean;
    note: string;
    uses?: number;
    flavorName?: string;
    flavorDescription?: string;
    customDamageType?: string;
}
export interface PackedMechWeaponSaveData extends PackedEquipmentData {
    loaded: boolean;
    mod?: PackedEquipmentData;
    customDamageType?: string;
    maxUseOverride?: number;
}
export interface PackedWeaponSlotData {
    size: string;
    weapon: PackedMechWeaponSaveData | null;
}

export interface PackedMountData {
    mount_type: string;
    lock: boolean;
    slots: PackedWeaponSlotData[];
    extra: PackedWeaponSlotData[];
    bonus_effects: string[];
}

export interface PackedMechLoadoutData {
    id: string;
    name: string;
    systems: PackedEquipmentData[];
    integratedSystems: PackedEquipmentData[];
    mounts: PackedMountData[];
    integratedMounts: { weapon: PackedMechWeaponSaveData }[];
    improved_armament: PackedMountData;
    integratedWeapon: PackedMountData;
}

//////////////// REG INFO ///////////////////
// This is fortunately much simpler because we just use the state of weapons (no need to track anything about them, just the weapons themselves).
// We also don't name things because aaaaaaaaaaaaaa
// For the time being we are ignoring auto-stab. we'll probably just make it a standard mod
export interface RegMechLoadoutData {
    system_mounts: RegSysMountData[];
    weapon_mounts: RegWepMountData[];
    frame: RegRef<EntryType.FRAME> | null;
}

// Fairly simple, will eventually expand to cover sys mods
export interface RegSysMountData {
    system: RegRef<EntryType.MECH_SYSTEM> | null;
}

// Has a number of slots, each with a capacity for a mod
export interface RegWepMountData {
    mount_type: MountType;
    slots: Array<{
        weapon: RegRef<EntryType.MECH_WEAPON> | null;
        mod: RegRef<EntryType.WEAPON_MOD> | null;
        size: FittingSize;
    }>;
}

export class MechLoadout extends RegSer<RegMechLoadoutData> {
    Frame!: Frame | null;
    SysMounts!: SystemMount[];
    WepMounts!: WeaponMount[]; // TODO: check or auto populate mounts in some way, based on frame

    public async load(data: RegMechLoadoutData): Promise<void> {
        merge_defaults(data, defaults.MECH_LOADOUT());
        this.SysMounts = data.system_mounts.map(s => new SystemMount(this.Registry, this.OpCtx, s));
        this.WepMounts = data.weapon_mounts.map(w => new WeaponMount(this.Registry, this.OpCtx, w));
        this.Frame = data.frame ? await this.Registry.resolve(this.OpCtx, data.frame, {wait_ctx_ready: false}) : null;
    }

    protected save_imp(): RegMechLoadoutData {
        return {
            system_mounts: SerUtil.save_all(this.SysMounts),
            weapon_mounts: SerUtil.save_all(this.WepMounts),
            frame: this.Frame?.as_ref() ?? null,
        };
    }

    // A simple list of currently equipped systems
    public get Systems(): MechSystem[] {
        return this.SysMounts.filter(sm => sm.System != null).map(sm => sm.System!);
    }

    // A simple list of currently equipped weapons
    public get Weapons(): MechWeapon[] {
        let slots = this.WepMounts.flatMap(wm => wm.Slots);
        return slots.map(s => s.Weapon).filter(x => !!x) as MechWeapon[];
    }

    // Concat the above
    public get Equipment(): MechEquipment[] {
        return [...this.Systems, ...this.Weapons];
    }

    // Get all mods as a list
    public get AllMods(): WeaponMod[] {
        let slots = this.WepMounts.flatMap(wm => wm.Slots);
        return slots.filter(s => !!s.Weapon && !!s.Mod).map(s => s.Mod) as WeaponMod[];
    }

    // Compute total SP
    public get TotalSP(): number {
        let tot = 0;
        for (let e of this.Equipment) {
            tot += e.SP;
        }
        for (let m of this.AllMods) {
            tot += m.SP;
        }
        return tot;
    }

    // Any empty mounts
    public get HasEmptyMounts(): boolean {
        for (let s of this.WepMounts.flatMap(s => s.Slots)) {
            if (s.Weapon == null) {
                return true;
            }
        }
        return false;
    }

    // Resets this mech's mounts to match what the frame should have
    public async reset_weapon_mounts(): Promise<void> {
        this.WepMounts = [];
        if (this.Frame) {
            for (let size of this.Frame.Mounts) {
                await this.AddEmptyWeaponMount(size);
            }
        }
    }

    // Attempts to equip a weapon. Makes a new mount as necessary NOTE: This weapon does NOT handle insinuation. do that yourself, dummy!
    public async equip_weapon(weapon: MechWeapon): Promise<void> {
        // Just jam it in any empty one that'll fit us
        for (let mount of this.WepMounts) {
            if (mount.try_add_weapon(weapon)) {
                return; // We're done
            }
        }

        // Agh. Nothing accepted it. Make a new unknown mount. Validation is a separate concern that we don't handle here
        let new_mount = await this.AddEmptyWeaponMount(MountType.Unknown);
        new_mount.try_add_weapon(weapon); // Should always succeed
    }

    // Just make a new sys mount. We don't really expect these to be empty, so don't bother checking.
    public async equip_system(system: MechSystem) {
        let new_mount = await this.AddEmptySystemMount();
        new_mount.System = system;
    }

    // We do this quite often. Creates a new empty mount of the specified size
    async AddEmptyWeaponMount(type: MountType): Promise<WeaponMount> {
        let mount = new WeaponMount(this.Registry, this.OpCtx, { mount_type: type, slots: [] });
        await mount.load_done(); // Basically a no-op to make sure it doesn't override our stuff
        mount.reset(); // Give it its default slots
        this.WepMounts.push(mount);
        return mount;
    }

    // Sibling to the above
    async AddEmptySystemMount(): Promise<SystemMount> {
        let mount = new SystemMount(this.Registry, this.OpCtx, { system: null });
        await mount.load_done(); // Basically a no-op to make sure it doesn't override our stuff
        this.SysMounts.push(mount);
        return mount;
    }

    // Sync this loadout with compcon style loadout data
    // There's no real reason to restrict this logic just to unpacking, as we never just want a loadout on its own - only useful as part of a mech sync
    public async sync(
        full_mech_data: PackedMechData,
        mech_loadout: PackedMechLoadoutData,
        stack: RegFallbackStack,
        sync_hooks: AllHooks
    ): Promise<void> {
        // Find the frame
        let frame = await fallback_obtain_ref(
            stack,
            this.OpCtx,
            {
                type: EntryType.FRAME,
                fallback_lid: full_mech_data.frame,
                id: "",
            },
            sync_hooks
        );

        // Hooksave it
        if(frame) {
            if(sync_hooks.sync_frame)
                await sync_hooks.sync_frame(frame, full_mech_data, frame.Flags[FALLBACK_WAS_INSINUATED]);
            await frame.writeback();

            // Hook its deployaables
            if(sync_hooks.sync_deployable_nosave) {
                for(let d of frame.CoreSystem.Deployables) {
                    await sync_hooks.sync_deployable_nosave(d);
                }
                for(let t of frame.Traits) {
                    for(let d of t.Deployables) {
                        await sync_hooks.sync_deployable_nosave(d);
                    }
                }
            }
        }

        // Reconstruct the mount setup
        this.WepMounts = [];
        this.SysMounts = [];

        // Get all of our mount data
        let to_be_rendered: PackedMountData[] = [];

        // let mount_index = 0; // used for re-using weapons
        for (let integrated_wep of mech_loadout.integratedMounts) {
            // Coerce into the normal packed form, for our sanity's sake
            let coerced: PackedMountData = {
                bonus_effects: [],
                extra: [],
                lock: true,
                mount_type: MountType.Integrated,
                slots: [
                    {
                        size: FittingSize.Integrated,
                        weapon: integrated_wep.weapon,
                    },
                ],
            };
            to_be_rendered.push(coerced);
        }

        // TODO: fix core bonus based stuff. I admittedly forget why I didn't just do this earlier???
        // if(mech_loadout.integratedWeapon) {
        if (false) {
            to_be_rendered.push(mech_loadout.integratedWeapon);
        }
        // if(mech_loadout.improved_armament) {
        if (false) {
            to_be_rendered.push(mech_loadout.improved_armament);
        }

        to_be_rendered.push(...mech_loadout.mounts);

        for (let tbr of to_be_rendered) {
            let mount = await this.AddEmptyWeaponMount(tbr.mount_type as MountType);
            await mount.sync(tbr, stack, sync_hooks);
        }

        // Now systems. We check if they are in the same position to preserve typedness/customization, but otherwise make no especial effort
        // That will be handled later if we can convince beef to litter more UIDs
        for (let i = 0; i < mech_loadout.systems.length; i++) {
            // Get the mech loadout system entry
            let mls = mech_loadout.systems[i];

            // Create a mount and check the corresponding
            let mount = await this.AddEmptySystemMount();
            await mount.load_done(); // Should be basically instant

            // If system already exists no need to fetch
            let sys: MechSystem | null = null;
            let corr = this.SysMounts[i];
            if (corr?.System?.LID == mls.id) {
                sys = corr.System;
            } else {
                // Look it up
                sys = await fallback_obtain_ref(
                    stack,
                    this.OpCtx,
                    {
                        type: EntryType.MECH_SYSTEM,
                        fallback_lid: mls.id,
                        id: "",
                    },
                    sync_hooks
                );
            }

            // Update state
            if (sys) {
                sys.Destroyed = mls.destroyed ?? sys.Destroyed;
                sys.Cascading = mls.cascading ?? sys.Cascading;
                sys.Uses = mls.uses ?? sys.Uses;
                if(sync_hooks.sync_mech_system)
                    await sync_hooks.sync_mech_system(sys, mls, sys.Flags[FALLBACK_WAS_INSINUATED]);
                await sys.writeback();

                // Hook its deployables
                if(sync_hooks.sync_deployable_nosave) {
                    for(let d of sys.Deployables) {
                        await sync_hooks.sync_deployable_nosave(d);
                    }
                }
            }

            // Append the new mount
            mount.System = sys;
        }

        // Save
        this.Frame = frame;
    }

    public async emit(): Promise<PackedMechLoadoutData> {
        let cc_mounts: PackedMountData[] = [];
        for(let mount of this.WepMounts) {
            let cc_slots: PackedWeaponSlotData[] = [];
            for(let slot of mount.Slots) {
                // Init an empty slot
                let cc_slot: PackedWeaponSlotData = {
                    size: slot.Size,
                    weapon: null,
                };

                // Set weapon if it exists
                if(slot.Weapon) {
                    cc_slot.weapon = {
                        cascading: slot.Weapon.Cascading,
                        destroyed: slot.Weapon.Destroyed,
                        loaded: slot.Weapon.Loaded,
                        id: slot.Weapon.LID,
                        note: "",
                        uses: slot.Weapon.Uses,
                    }
                    if(slot.Mod) {
                        cc_slot.weapon.mod = {
                            cascading: slot.Mod.Cascading,
                            destroyed: slot.Mod.Destroyed,
                            id: slot.Mod.LID,
                            note: "",
                            uses: slot.Mod.Uses,
                        }
                    }
                }

                cc_slots.push(cc_slot);
            }
            cc_mounts.push({
                bonus_effects: [],
                extra: [],
                lock: false,
                mount_type: mount.MountType,
                slots: cc_slots
            });
        }

        let systems = this.Systems.map(s => ({
            id: s.LID,
            cascading: s.Cascading,
            destroyed: s.Destroyed,
            note: "",
        }))

        return {
            id: `loadout_${nanoid()}`,
            name: "Foundry Loadout",
            mounts: cc_mounts,
            systems,
            integratedMounts: [],
            integratedSystems: [],

            // Until we properly support this, just back default empty
            integratedWeapon: {
                bonus_effects: [],
                extra: [],
                lock: false,
                mount_type:  MountType.Aux,
                slots: [
                    {
                        size: WeaponSize.Aux,
                        weapon: null 
                    }
                ]
            },

            // Until we properly support this, just back default empty
            improved_armament: {
                bonus_effects: [],
                lock: false,
                mount_type:  MountType.Flex,
                slots: [
                    {
                        size: WeaponSize.Aux,
                        weapon: null
                    }
                ],
                extra: [
                    {
                        size: WeaponSize.Aux,
                        weapon: null
                    }
                ],

            }
        }
    }
}

// Just wraps a system (slot can be empty). For system mod future compatibility
export class SystemMount extends RegSer<RegSysMountData> {
    System!: MechSystem | null; // The system
    Integrated!: boolean; // Is it integrated?

    public async load(data: RegSysMountData): Promise<void> {
        if (data.system) {
            this.System = await this.Registry.resolve(this.OpCtx, data.system, {wait_ctx_ready: false});
        } else {
            this.System = null;
        }
    }

    protected save_imp(): RegSysMountData {
        return {
            system: this.System?.as_ref() ?? null,
        };
    }
}

// Holds weapons/their mods. We don't support reshaping mounts very well as of yet
export class WeaponSlot {
    Weapon: MechWeapon | null;
    Mod: WeaponMod | null;
    Size: FittingSize; // The size of this individual slot
    Mount: WeaponMount;

    // Simple constructor
    constructor(
        weapon: MechWeapon | null,
        mod: WeaponMod | null,
        size: FittingSize,
        mount: WeaponMount
    ) {
        this.Weapon = weapon;
        this.Mod = mod;
        this.Size = size;
        this.Mount = mount;
    }

    // Return error string if this slot cant take the specified item (with or without replacement)
    check_can_take(item: MechWeapon | WeaponMod, replace: boolean = false): string | null {
        if (item instanceof MechWeapon) {
            // Checkem
            if (this.Weapon && !replace) {
                return "Slot is full"; // Already full
            }

            // Delegate
            return this._check_pair(item, this.Mod);
        } else {
            // we full
            if (this.Mod && !replace) {
                return "Mod already exists";
            }

            // Delegate
            return this._check_pair(this.Weapon, item);
        }
    }

    // Sub validator
    private _check_pair(wep: MechWeapon | null, mod: WeaponMod | null): string | null {
        if (!wep && mod) {
            return "Mod without weapon";
        } else if (!wep) {
            return null; // Empty is fine
        } else if (weapon_size_magnitude(wep.Size) > weapon_size_magnitude(this.Size)) {
            return "Weapon too large to fit";
        } else if (this.Mount.Integrated && mod) {
            return "Cannot mod integrated weapons";
        } else if (mod && !mod.accepts(wep)) {
            return "Mod cannot be applied to this weapon";
        }
        return null;
    }

    // Clear slots
    clear() {
        this.Weapon = null;
        this.Mod = null;
    }

    // Check that we're still good. String indicates error
    validate(): string | null {
        return this._check_pair(this.Weapon, this.Mod);
    }

    // Attempts to copy this slot to the newly provided one, only proceeding if check_can_take passes without complaint
    copy_to(other: WeaponSlot) {
        if (this.Weapon) {
            if (other.check_can_take(this.Weapon) === null) {
                other.Weapon = this.Weapon;
            }

            if (this.Mod) {
                if (other.check_can_take(this.Mod)) {
                    other.Mod = this.Mod;
                }
            }
        }
    }

    // Take in the specified data
    async sync(
        dat: PackedWeaponSlotData,
        stack: RegFallbackStack,
        ctx: OpCtx,
        hooks: AllHooks
    ): Promise<void> {
        // First we resolve the weapon
        if (dat.weapon) {
            // See if we already have that weapon mounted
            if (this.Weapon && dat.weapon.id == this.Weapon.LID) {
                // Do nothing. Weapon is unchanged
            } else {
                // Otherwise attempt to resolve
                this.Weapon = await fallback_obtain_ref(
                    stack,
                    ctx,
                    {
                        type: EntryType.MECH_WEAPON,
                        fallback_lid: dat.weapon.id,
                        id: "",
                    },
                    hooks
                );
            }

            // We have resolved the weapon. Now update state
            if (this.Weapon) {
                this.Weapon.Uses = dat.weapon.uses ?? this.Weapon.Uses;
                this.Weapon.Destroyed = dat.weapon.destroyed ?? this.Weapon.Destroyed;
                this.Weapon.Cascading = dat.weapon.cascading ?? this.Weapon.Cascading;
                this.Weapon.Loaded = dat.weapon.loaded ?? this.Weapon.Loaded;
                if(hooks.sync_mech_weapon)
                    await hooks.sync_mech_weapon(this.Weapon, dat.weapon, this.Weapon.Flags[FALLBACK_WAS_INSINUATED]);
                await this.Weapon.writeback();

                // Hook its deployables
                if(hooks.sync_deployable_nosave) {
                    for(let d of this.Weapon.Deployables) {
                        await hooks.sync_deployable_nosave(d);
                    }
                }

                // Proceed with modding
                if (dat.weapon.mod) {
                    let mod = dat.weapon.mod;

                    // See if we already have that mod mounted
                    if (this.Mod && mod.id == this.Mod.LID) {
                        // Do nothing. Mod is unchanged
                    } else {
                        // Attempt to resolve mod
                        this.Mod = await fallback_obtain_ref(
                            stack,
                            ctx,
                            {
                                type: EntryType.WEAPON_MOD,
                                fallback_lid: mod.id,
                                id: "",
                            },
                            hooks
                        );
                    }

                    // We have resolved the mod. Now update state
                    if (this.Mod) {
                        this.Mod.Uses = mod.uses ?? this.Mod.Uses;
                        this.Mod.Destroyed = mod.destroyed ?? this.Mod.Destroyed;
                        this.Mod.Cascading = mod.cascading ?? this.Mod.Cascading;
                        if(hooks.sync_weapon_mod)
                            await hooks.sync_weapon_mod(this.Mod, dat.weapon.mod, this.Weapon.Flags[FALLBACK_WAS_INSINUATED]);
                        await this.Mod.writeback();
                        if(hooks.sync_deployable_nosave) {
                            for(let d of this.Mod.Deployables) {
                                await hooks.sync_deployable_nosave(d);
                            }
                        }
                    }
                }
            }
        }
    }
}

export class WeaponMount extends RegSer<RegWepMountData> {
    // The size of the mount
    MountType!: MountType;

    // The slots of the mount
    Slots!: WeaponSlot[];

    // Is it integrated? (forbids mods). Separate from mounttype integrated, which is strictly for frame-integrated mounts
    Integrated!: boolean;

    Bracing!: boolean; // True if this mount is being used as bracing. Forbids use of anything else

    // Validate the provided slots based on this mounts current configuration
    private _validate_slots(slots: WeaponSlot[]): string | null {
        // Check slots
        let sub_errors = slots.map(s => s.validate()).filter(s => s) as string[];
        if (sub_errors.length) {
            return sub_errors.join("; ");
        }

        // Check that if we are flex, they aren't trying to main-aux
        if (
            this.MountType == MountType.Flex &&
            this.Slots[0]?.Weapon?.Size == WeaponSize.Main &&
            this.Slots[1].Weapon !== null
        ) {
            return "Flex cannot have Main & Aux. Acceptable configurations are Aux/Aux and Main";
        }

        // Check that if we are bracing, all slots are empty
        if (this.Bracing && this.Slots.some(s => s.Weapon)) {
            return "Superheavy bracing must be empty of weapons";
        }

        return null;
    }

    // Makes sure everything is as we expect it
    public validate(): string | null {
        return this._validate_slots(this.Slots);
    }

    // Adds weapon to next available fitting, if possible. Returns success
    public try_add_weapon(wep: MechWeapon): boolean {
        // Sort them smallest to largest. We prefer filling a smaller mount over a larger one
        let sorted_slots = [...this.Slots].sort(
            (a, b) => weapon_size_magnitude(a.Size) - weapon_size_magnitude(b.Size)
        );

        for (let s of sorted_slots) {
            if (s.check_can_take(wep) === null) {
                // Put it
                s.Weapon = wep;
                return true;
            }
        }
        return false;
    }

    // Clear all slots
    public reset() {
        this.Slots = this._slots_for_mount(this.MountType);
    }

    // Pre-populate slots for a mount
    private _slots_for_mount(mount: MountType): WeaponSlot[] {
        switch (mount) {
            case MountType.Main:
                return [new WeaponSlot(null, null, FittingSize.Main, this)];
            case MountType.Aux:
                return [new WeaponSlot(null, null, FittingSize.Auxiliary, this)];
            case MountType.Flex:
            case MountType.MainAux: // Differ only in acceptable configurations
                return [
                    new WeaponSlot(null, null, FittingSize.Main, this),
                    new WeaponSlot(null, null, FittingSize.Auxiliary, this),
                ];
            case MountType.AuxAux:
                return [
                    new WeaponSlot(null, null, FittingSize.Auxiliary, this),
                    new WeaponSlot(null, null, FittingSize.Auxiliary, this),
                ];
            case MountType.Heavy:
                return [new WeaponSlot(null, null, FittingSize.Heavy, this)];
            case MountType.Integrated:
            case MountType.Unknown:
                return [new WeaponSlot(null, null, FittingSize.Integrated, this)];
            default:
                return [];
        }
    }

    // Match the provided mount data. Use the provided reg to facillitate lookup of required items from outside of mech
    public async sync(mnt: PackedMountData, fallback: RegFallbackStack, sync_hooks: SyncHooks) {
        // Init slots based on our size
        this.MountType = mnt.mount_type as MountType;
        this.Slots = this._slots_for_mount(this.MountType);

        // Prepare to map them out
        let packed_slots = [...mnt.slots, ...mnt.extra];

        // Sync step through them. Stop if we are main + flex. Important that we don't just clobber for loading and other information preservation (I think? it is late...)
        for (let i = 0; i < this.Slots.length; i++) {
            let s = this.Slots[i];
            let cw = packed_slots[i];
            if (cw) {
                await s.sync(cw, fallback, this.OpCtx, sync_hooks);
            }
        }

        if(sync_hooks.sync_weapon_mount) 
            await sync_hooks.sync_weapon_mount(this, mnt, true);
    }

    public async load(data: RegWepMountData): Promise<void> {
        merge_defaults(data, defaults.WEAPON_MOUNT_DATA());
        this.MountType = data.mount_type;
        this.Slots = this._slots_for_mount(this.MountType);

        for (let i = 0; i < data.slots.length && i < this.Slots.length; i++) {
            let s = data.slots[i];
            this.Slots[i].Weapon = s.weapon
                ? await this.Registry.resolve(this.OpCtx, s.weapon, {wait_ctx_ready: false})
                : null;
            this.Slots[i].Mod = s.mod ? await this.Registry.resolve(this.OpCtx, s.mod, {wait_ctx_ready: false}) : null;
        }
    }

    protected save_imp(): RegWepMountData {
        return {
            mount_type: this.MountType,
            slots: this.Slots.map(s => {
                return {
                    mod: s.Mod?.as_ref() ?? null,
                    weapon: s.Weapon?.as_ref() ?? null,
                    size: s.Size,
                };
            }),
        };
    }
}

/**
 * Yields a number suitable for sowrting weapons/mounts by their size.
 * If a fitting size is >= a weapon size, then that fitting can hold that weapon
 * Higher = bigger. Useful to determine slot fill priority, as filling largest weapons first to largest slots gives a higher likelihood of proper fit.
 * @param size  The size to rank
 */
export function weapon_size_magnitude(size: WeaponSize | FittingSize): number {
    switch (size) {
        case WeaponSize.Aux:
        case FittingSize.Auxiliary:
            return 1;

        case WeaponSize.Main:
        case FittingSize.Flex:
            return 2;

        case FittingSize.Main: // We'd prefer to fill a main fitting before a flex
            return 3;

        case WeaponSize.Heavy:
        case FittingSize.Heavy:
            return 4;

        case WeaponSize.Superheavy:
            return 5;

        case FittingSize.Integrated:
            return 6;
    }
}
