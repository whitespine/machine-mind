import { MechSystem, Mech, MechWeapon, WeaponMod, MechEquipment, Frame } from "@src/class";
import { defaults } from "@src/funcs";
import {
    EntryType,
    OpCtx,
    quick_mm_ref,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
    SimSer,
} from "@src/registry";
import { weapons } from "lancer-data";
import { basename } from "path";
import { FittingSize, MountType, WeaponSize } from "../../enums";

//////////////////////// PACKED INFO ////////////////////////
interface PackedEquipmentData {
    id: string;
    destroyed: boolean;
    cascading: boolean;
    note: string;
    uses?: number;
    flavorName?: string;
    flavorDescription?: string;
    customDamageType?: string;
}
interface PackedMechWeaponSaveData extends PackedEquipmentData {
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
    WepMounts!: WeaponMount[];

    public async load(data: RegMechLoadoutData): Promise<void> {
        data = {...defaults.MECH_LOADOUT(), ...data};
        this.SysMounts = await Promise.all(
            data.system_mounts.map(s => new SystemMount(this.Registry, this.OpCtx, s).ready())
        );
        this.WepMounts = await Promise.all(
            data.weapon_mounts.map(w => new WeaponMount(this.Registry, this.OpCtx, w).ready())
        );
        this.Frame = data.frame ? await this.Registry.resolve(this.OpCtx, data.frame) : null;
    }

    public save(): RegMechLoadoutData {
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

    public static async unpack(
        mech_frame_id: string,
        mech_loadout: PackedMechLoadoutData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<MechLoadout> {
        let base = new MechLoadout(reg, ctx, { frame: null, system_mounts: [], weapon_mounts: [] });
        await base.ready(); // Eff no-op to make sure it doesn't override our stuff
        await base.sync(mech_frame_id, mech_loadout, reg);
        return base;
    }

    // We do this quite often
    private async _new_mount(type: MountType): Promise<WeaponMount> {
        let mount = new WeaponMount(this.Registry, this.OpCtx, { mount_type: type, slots: [] });
        await mount.ready(); // Basically a no-op to make sure it doesn't override our stuff
        return mount;
    }

    // There's no real reason to restrict this logic just to unpacking. Having it be a method allows us to avoid replicating work
    public async sync(
        mech_frame_id: string,
        mech_loadout: PackedMechLoadoutData,
        override_reg: Registry
    ): Promise<void> {
        // Find the frame
        let frame = await override_reg.resolve(
            this.OpCtx,
            quick_mm_ref(EntryType.FRAME, mech_frame_id)
        );

        // Reconstruct the mount setup
        let weps: WeaponMount[] = [];
        let syss: SystemMount[] = [];

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

        // This can be improved once beef makes that possible
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
            let mount = new WeaponMount(this.Registry, this.OpCtx, {
                slots: [],
                mount_type: tbr.mount_type as MountType,
            });
            await mount.ready(); // no-op
            await mount.sync(tbr, override_reg);
            weps.push(mount);
        }

        // Now systems. We check if they are in the same position to preserve typedness/customization, but otherwise make no especial effort
        // That will be handled later if we can convince beef to litter more UIDs
        for (let i = 0; i < mech_loadout.systems.length; i++) {
            // Get the mech loadout system entry
            let mls = mech_loadout.systems[i];

            // Create a mount and check the corresponding
            let nm = new SystemMount(this.Registry, this.OpCtx, { system: null });
            await nm.ready(); // Should be basically instant

            // If system already exists no need to fetch
            let sys: MechSystem | null = null;
            let corr = this.SysMounts[i];
            if (corr?.System?.ID == mls.id) {
                sys = corr.System;
            } else {
                // Look it up
                sys = await override_reg.resolve(
                    this.OpCtx,
                    quick_mm_ref(EntryType.MECH_SYSTEM, mls.id)
                );
            }

            // Update state
            if (sys) {
                sys.Destroyed = mls.destroyed ?? sys.Destroyed;
                sys.Cascading = mls.cascading ?? sys.Cascading;
                sys.Uses = mls.uses ?? sys.Uses;
                await sys.writeback();
            }

            // Append the new mount
            nm.System = sys;
            syss.push(nm);
        }

        // Save
        this.Frame = frame;
        this.WepMounts = weps;
        this.SysMounts = syss;
    }
}

// Just wraps a system (slot can be empty)
export class SystemMount extends RegSer<RegSysMountData> {
    System!: MechSystem | null; // The system
    Integrated!: boolean; // Is it integrated?

    public async load(data: RegSysMountData): Promise<void> {
        if (data.system) {
            this.System = await this.Registry.resolve(this.OpCtx, data.system);
        } else {
            this.System = null;
        }
    }

    public save(): RegSysMountData {
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
        } else if (size_num(wep.Size) > size_num(this.Size)) {
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
    async sync(dat: PackedWeaponSlotData, reg: Registry, ctx: OpCtx): Promise<void> {
        // First we resolve the weapon
        if (dat.weapon) {
            // See if we already have that weapon mounted
            if (this.Weapon && dat.weapon.id == this.Weapon.ID) {
                // Do nothing. Weapon is unchanged
            } else {
                // Otherwise attempt to resolve from the provided reg
                this.Weapon = await reg.resolve(
                    ctx,
                    quick_mm_ref(EntryType.MECH_WEAPON, dat.weapon.id)
                );
            }

            // We have resolved the weapon. Now update state
            if (this.Weapon) {
                this.Weapon.Uses = dat.weapon.uses ?? this.Weapon.Uses;
                this.Weapon.Destroyed = dat.weapon.destroyed ?? this.Weapon.Destroyed;
                this.Weapon.Cascading = dat.weapon.cascading ?? this.Weapon.Cascading;
                this.Weapon.Loaded = dat.weapon.loaded ?? this.Weapon.Loaded;
                await this.Weapon.writeback();

                // Proceed with modding
                if (dat.weapon.mod) {
                    let mod = dat.weapon.mod;

                    // See if we already have that mod mounted
                    if (this.Mod && mod.id == this.Mod.ID) {
                        // Do nothing. Mod is unchanged
                    } else {
                        // Attempt to resolve mod
                        this.Mod = await reg.resolve(
                            ctx,
                            quick_mm_ref(EntryType.WEAPON_MOD, mod.id)
                        );
                    }

                    // We have resolved the mod. Now update state
                    if (this.Mod) {
                        this.Mod.Uses = mod.uses ?? this.Mod.Uses;
                        this.Mod.Destroyed = mod.destroyed ?? this.Mod.Destroyed;
                        this.Mod.Cascading = mod.cascading ?? this.Mod.Cascading;
                        await this.Mod.writeback();
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

    // Is it from a core bonus
    // from_cb..... how we do this?

    Bracing!: boolean; // True if this mount is being used as bracing. Forbids use of anything else

    // Validate the provided slots based on this mounts current configuration
    private _validate_slots(slots: WeaponSlot[]): string | null {
        // Check slots
        let sub_errors = slots.map(s => s.validate()).filter(s => s) as string[];
        if (sub_errors.length) {
            return sub_errors.join("; ");
        }

        // Check that if we are flex, they aren't trying to main-aux
        if (this.MountType == MountType.Flex && this.Slots[1].Weapon !== null) {
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

    // Adds weapon to next available fitting, if possible. If not, returns a string stating an error
    public try_add_weapon(wep: MechWeapon) {
        for (let s of this.Slots) {
            if (s.check_can_take(wep) === null) {
                // Put it
                s.Weapon = wep;
            }
        }
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
                return [new WeaponSlot(null, null, FittingSize.Integrated, this)];
            default:
                return [];
        }
    }

    // Match the provided mount data. Use the provided reg to facillitate lookup of required items from outside of mech
    public async sync(mnt: PackedMountData, override_reg: Registry) {
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
                await s.sync(cw, override_reg, this.OpCtx);
            }
        }
    }

    public async load(data: RegWepMountData): Promise<void> {
        data = {...defaults.WEAPON_MOUNT_DATA(), ...data};
        this.MountType = data.mount_type;
        this.Slots = this._slots_for_mount(this.MountType);

        for (let i = 0; i < data.slots.length && i < this.Slots.length; i++) {
            let s = data.slots[i];
            this.Slots[i].Weapon = s.weapon
                ? await this.Registry.resolve(this.OpCtx, s.weapon)
                : null;
            this.Slots[i].Mod = s.mod ? await this.Registry.resolve(this.OpCtx, s.mod) : null;
        }
    }

    public save(): RegWepMountData {
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

function size_num(size: WeaponSize | FittingSize) {
    switch (size) {
        case WeaponSize.Aux:
        case FittingSize.Auxiliary:
            return 1;

        case WeaponSize.Main:
        case FittingSize.Main:
        case FittingSize.Flex:
            return 2;

        case WeaponSize.Heavy:
        case FittingSize.Heavy:
            return 3;

        case WeaponSize.Superheavy:
            return 4;

        case FittingSize.Integrated:
            return 5; // can hold anything
    }
}
