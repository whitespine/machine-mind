import { MechSystem, Mech, MechWeapon, WeaponMod, MechEquipment } from "@/class";
import { EntryType, RegRef, RegSer, SerUtil, SimSer } from "@/registry";
import { FittingSize, WeaponSize } from "../enums";
import { Frame } from "./Frame";

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
}

// Fairly simple, will eventually expand to cover sys mods
export interface RegSysMountData {
    system: RegRef<EntryType.MECH_SYSTEM> | null;
}

// Has a number of slots, each with a capacity for a mod
export interface RegWepMountData {
    fitting: FittingSize;
    slots: Array<{
        weapon: RegRef<EntryType.MECH_WEAPON> | null;
        mod: RegRef<EntryType.WEAPON_MOD> | null;
        size: WeaponSize;
    }>;
}

export class MechLoadout extends RegSer<RegMechLoadoutData> {
    SysMounts!: SystemMount[];
    WepMounts!: WeaponMount[];

    public async load(data: RegMechLoadoutData): Promise<void> {
        this.SysMounts = await Promise.all(
            data.system_mounts.map(s => new SystemMount(this.Registry, s).ready())
        );
        this.WepMounts = await Promise.all(
            data.weapon_mounts.map(w => new WeaponMount(this.Registry, w).ready())
        );
    }

    public async save(): Promise<RegMechLoadoutData> {
        return {
            system_mounts: await SerUtil.save_all(this.SysMounts),
            weapon_mounts: await SerUtil.save_all(this.WepMounts),
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
}

// Just wraps a system (slot can be empty)
export class SystemMount extends RegSer<RegSysMountData> {
    System!: MechSystem | null;

    public async load(data: RegSysMountData): Promise<void> {
        if (data.system) {
            this.System = await this.Registry.resolve(data.system);
        } else {
            this.System = null;
        }
    }

    public async save(): Promise<RegSysMountData> {
        return {
            system: this.System?.as_ref() ?? null,
        };
    }
}

// Holds weapons/their mods. We don't support reshaping mounts very well as of yet
export type WeaponSlot = {
    Weapon: MechWeapon | null;
    Mod: WeaponMod | null;
    Size: WeaponSize; // The size of this individual slot
};
export class WeaponMount extends RegSer<RegWepMountData> {
    // The size of the mount
    Fitting!: FittingSize;

    // The slots of the mount
    Slots!: WeaponSlot[];

    // Is it integrated? (forbids mods)
    Integrated!: boolean;

    // Is it from a core bonus
    // from_cb..... how we do this?

    Bracing!: boolean; // True if this mount is being used as bracing

    private validate_slot(slot: WeaponSlot, weapon: MechWeapon): string | null {
        // string error if something is amiss
        if (slot.Mod && !slot.Weapon) {
            return "Mod on empty weapon slot";
        }

        if (this.Integrated && slot.Mod) {
            return "Mods are forbidden on integrated mounts";
        }

        // Otherwise size is the main concern
        switch (slot.Size) {
            case WeaponSize.Aux:
                return weapon.Size === WeaponSize.Aux
                    ? null
                    : "Only Aux weapons can fit in aux slots";
            case WeaponSize.Main:
                return weapon.Size === WeaponSize.Aux || weapon.Size === WeaponSize.Main
                    ? null
                    : "Only Aux/Main weapons can fit in Main slots";
            default:
                break; // rest are fine
        }

        // TODO: Check mod is valid
        return null;
    }

    // Makes sure everything is as we expect it
    public validate(): boolean {
        return true;
        // Todo: check all slots, check that slot+sizes are correct
    }

    public async load(data: RegWepMountData): Promise<void> {
        this.Fitting = data.fitting;
        this.Slots = [];
        for (let s of data.slots) {
            let wep = s.weapon ? await this.Registry.resolve(s.weapon) : null;
            if (!wep) {
                // It has been removed, in all likelihood
                this.Slots.push({
                    Weapon: null,
                    Mod: null,
                    Size: s.size,
                });
            } else {
                // Now look for mod
                let mod = s.mod ? await this.Registry.resolve(s.mod) : null;
                this.Slots.push({
                    Weapon: wep,
                    Mod: mod,
                    Size: s.size,
                });
            }
        }
    }

    public async save(): Promise<RegWepMountData> {
        return {
            fitting: this.Fitting,
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

/*
export class MechLoadout {
    IntegratedMounts!: IntegratedMount[];
    EquippableMounts!: EquippableMount[];
    ImprovedArmament!: EquippableMount;
    IntegratedWeapon!: EquippableMount;
    Systems!: MechSystem[];
    IntegratedSystems!: MechSystem[];

    public constructor(mech: Mech) {
        super(mech.Loadouts ? mech.Loadouts.length : 0);
        this._integratedMounts = [...mech.IntegratedMounts];
        this._equippableMounts = mech.Frame.Mounts.map(x => new EquippableMount(x));
        this._systems = [];
        this._integratedSystems = mech.IntegratedSystems;
        this._improvedArmament = new EquippableMount(MountType.Flex);
        this._integratedWeapon = new EquippableMount(MountType.Aux);
    }

    public UpdateIntegrated(mech: Mech): void {
        this._integratedSystems.splice(0, this._integratedSystems.length);

        mech.IntegratedSystems.forEach(s => {
            this._integratedSystems.push(s);
        });

        this._integratedMounts.splice(0, this._integratedMounts.length);

        mech.IntegratedMounts.forEach(s => {
            this._integratedMounts.push(s);
        });

        console.log(this._integratedMounts);

        this.save();
    }

    public AllMounts(improved?: boolean | null, integrated?: boolean | null): Mount[] {
        let ms: Mount[] = [];
        if (integrated) ms.push(this._integratedWeapon);
        if (improved && this._equippableMounts.length < 3) ms.push(this._improvedArmament);
        ms = ms.concat(this._equippableMounts).concat(this._integratedMounts);
        return ms;
    }

    public AllEquippableMounts(
        improved?: boolean | null,
        integrated?: boolean | null
    ): EquippableMount[] {
        let ms: EquippableMount[] = [];
        if (integrated) ms.push(this.IntegratedWeapon);
        if (improved && this.EquippableMounts.length < 3) ms.push(this.ImprovedArmament);
        ms = ms.concat(this.EquippableMounts);
        return ms;
    }

    public get Mounts(): Mount[] {
        return (this._integratedMounts as Mount[]).concat(this._equippableMounts);
    }

    public get HasEmptyMounts(): boolean {
        return this._equippableMounts
            .filter(x => !x.IsLocked)
            .flatMap(x => x.Slots)
            .some(y => y.Weapon === null);
    }

    public RemoveRetrofitting(): void {
        this.AllEquippableMounts(true, true).forEach(x => {
            if (x.Bonuses.some(x => x.ID === "cb_mount_retrofitting")) x.ClearBonuses();
        });
    }

    public get Equipment(): MechEquipment[] {
        const mods = this.Weapons.map(x => x.Mod).filter(x => x != null);
        const equip = (this.Weapons as MechEquipment[])
            .concat(this.Systems as MechEquipment[])
            .concat(this.IntegratedSystems as MechEquipment[]);
        if (mods.length > 0) return equip.concat(mods as MechEquipment[]);
        else return equip;
    }

    public get Weapons(): MechWeapon[] {
        return this.AllMounts(true, true)
            .filter(x => !x.IsLocked)
            .flatMap(x => x.Weapons)
            .filter(x => x != null);
    }

    public ReloadAll(): void {
        this.Weapons.forEach(w => {
            if (w.IsLoading) w.Loaded = true;
        });
    }

    public UnequipSuperheavy(): void {
        this.AllEquippableMounts(true, true).forEach(x => x.Unlock());
    }

    public get IntegratedSystems(): MechSystem[] {
        return this._integratedSystems;
    }

    public get Systems(): MechSystem[] {
        return this._systems;
    }

    public set Systems(systems: MechSystem[]) {
        this._systems = systems;
        this.save();
    }

    public HasSystem(systemID: string): boolean {
        return this.Systems.some(x => x.ID === systemID);
    }

    public GetSystem(systemID: string): MechSystem | null {
        return this.Systems.find(x => x.ID === systemID) || null;
    }

    public AddSystem(system: MechSystem): void {
        const sys = _.cloneDeep(system);
        this._systems.push(sys);
        this.save();
    }

    public ChangeSystem(index: number, system: MechSystem): void {
        this._systems.splice(index, 1, _.cloneDeep(system));
        this.save();
    }

    public RemoveSystem(system: MechSystem): void {
        const index = this._systems.findIndex(x => _.isEqual(x, system));
        if (index > -1) this._systems.splice(index, 1);
        this.save();
    }

    // Returns a list of requirements to provide every system, mod, and weapon used in
    // this mech loadout. Does not include the fraame itself
    public RequiredLicenses(): LicensedRequirementBuilder {
        // Init list
        const requirements = new LicensedRequirementBuilder();

        // Collect all required items
        const equippedWeapons = this.Weapons as LicensedItem[];
        const equippedMods = this.Weapons.map(x => x.Mod).filter(x => x !== null) as LicensedItem[];
        const equippedSystems = this._systems as LicensedItem[];
        const all_equipped = _.concat(equippedWeapons, equippedMods, equippedSystems);

        // add each and return
        for (let item of all_equipped) {
            requirements.add_item(item);
        }
        return requirements;
    }

    public get TotalSP(): number {
        const mountSP = [...this._equippableMounts, this._improvedArmament, this._integratedWeapon]
            .flatMap(x => x.Weapons)
            .reduce(function(a, b) {
                return a + (b ? b.TotalSP : 0);
            }, 0);

        const systemSP = this._systems.reduce(function(a, b) {
            return a + b.SP;
        }, 0);
        return mountSP + systemSP;
    }

    /*
    public get UniqueWeapons(): MechWeapon[] {
        return this.Weapons.filter(x => x.IsUnique);
    }

    public get UniqueSystems(): MechSystem[] {
        return this.Systems.filter(x => x.IsUnique);
    }

    public get UniqueMods(): WeaponMod[] {
        return this.Weapons.map(x => x.Mod).filter(y => y && y.IsUnique) as WeaponMod[]; // filter omits null
    }

    public get UniqueItems(): MechEquipment[] {
        return (this.UniqueWeapons as MechEquipment[])
            .concat(this.UniqueSystems as MechEquipment[])
            .concat(this.UniqueMods as MechEquipment[]);
    }

    public get AICount(): number {
        return this.Equipment.filter(x => x.).length;
    }

    public get Color(): string {
        return "mech-system";
    }
}

    */
