import {
    Rules,
    PilotArmor,
    PilotWeapon,
    PilotGear,
    Loadout,
    PilotEquipment,
    Counter,
    Bonus,
    Synergy,
} from "@/class";
import { PackedPilotArmorData, PackedPilotGearData, PackedPilotWeaponData } from "@/interface";
import { EntryType, LiveEntryTypes, RegSer, SimSer } from "@/registry";

// This is what is actually in the loadouts. The id's ref actual weapons
export interface PackedPilotEquipmentState {
    id: string;
    destroyed: boolean;
    uses: number;
    cascading: false;
    customDamageType: null;
}

export interface PackedPilotLoadoutData {
    id: string;
    name: string;
    armor: (PackedPilotEquipmentState | null)[]; // Accounts for gaps in the inventory slots.... Were it my call this wouldn't be how it was, but it ain't my way
    weapons: (PackedPilotEquipmentState | null)[];
    gear: (PackedPilotEquipmentState | null)[];
    extendedWeapons: (PackedPilotEquipmentState | null)[];
    extendedGear: (PackedPilotEquipmentState | null)[];
}

export class PilotLoadout extends RegSer<PackedPilotLoadoutData> {
    ID!: string;
    Name!: string;
    Armor!: (PilotArmor | null)[];
    Gear!: (PilotGear | null)[];
    Weapons!: (PilotWeapon | null)[];
    ExtendedWeapons!: (PilotWeapon | null)[];
    ExtendedGear!: (PilotGear | null)[];

    // This just gets it as a simple list
    get EquippedArmor(): PilotArmor[] {
        return this.Armor.filter(x => !!x) as PilotArmor[];
    }

    get EquippedGear(): PilotGear[] {
        return this.Gear.filter(x => !!x) as PilotGear[];
    }

    get EquippedWeapons(): PilotWeapon[] {
        return this.Weapons.filter(x => !!x) as PilotWeapon[];
    }

    get Items(): PilotEquipment[] {
        return [...this.EquippedArmor, ...this.EquippedGear, ...this.EquippedWeapons];
    }

    // Flattening methods
    // public get Counters(): Counter[] {
    // None of these things actually have items
    // return this.EquippedGear.flatMap(x => x.Counters).concat(this.EquippedWeapons.flatMap(x => x.
    // }

    // These commented items aren't usually needed
    // public get Integrated(): RegEntry<any, any>[] {
    // return this.UnlockedRanks.flatMap(x => x.integrated);
    // }

    // public get Deployables(): Deployable[] {
    // return this.UnlockedRanks.flatMap(x => x.deployables);
    // }

    // public get Actions(): Action[] {
    // return this.UnlockedRanks.flatMap(x => x.actions);
    // }

    public get Bonuses(): Bonus[] {
        return this.Items.flatMap(x => x.Bonuses);
    }

    public get Synergies(): Synergy[] {
        return this.Items.flatMap(x => x.Synergies);
    }

    private async resolve_state_item<T extends EntryType>(
        item_state: PackedPilotEquipmentState | null,
        expect_type: T
    ): Promise<LiveEntryTypes[T] | null> {
        // Simple case
        if (item_state == null) {
            return null;
        }
        /*
            id: string;
    destroyed: boolean;
    uses: number;
    cascading: false;
    customDamageType: null;
    */
        // Get the item
        let item = await this.Registry.get_cat(expect_type).lookup_mmid(item_state.id);
        if (!item) {
            console.warn(`Could not resolve item ${item_state.id}`);

            // TODO: this currently will basically only just move items around in the players inventory, which is obviously not ideal
            return null;
        } else if (item.Type != expect_type) {
            console.warn(
                `ID ${item_state.id} resolved to invalid slot-equippable type ${item.Type}`
            );
            return null;
        }

        // TODO: apply the other details
        return item;
    }

    private to_packed_ref(item: PilotEquipment | null): PackedPilotEquipmentState | null {
        // Just saves us some time later
        if (item == null) return null;

        return {
            // TODO: apply the other details
            cascading: false,
            customDamageType: null,
            destroyed: false,
            id: item.ID,
            uses: 0,
        };
    }

    protected async load(data: PackedPilotLoadoutData): Promise<void> {
        // Simple
        this.ID = data.id;
        this.Name = data.name;

        // We're a little
        this.Armor = await Promise.all(
            data.armor.map(a => this.resolve_state_item(a, EntryType.PILOT_ARMOR))
        );
        this.Gear = await Promise.all(
            data.gear.map(a => this.resolve_state_item(a, EntryType.PILOT_GEAR))
        );
        this.ExtendedGear = await Promise.all(
            data.extendedGear.map(a => this.resolve_state_item(a, EntryType.PILOT_GEAR))
        );
        this.Weapons = await Promise.all(
            data.weapons.map(a => this.resolve_state_item(a, EntryType.PILOT_WEAPON))
        );
        this.ExtendedWeapons = await Promise.all(
            data.extendedWeapons.map(a => this.resolve_state_item(a, EntryType.PILOT_WEAPON))
        );
    }

    public async save(): Promise<PackedPilotLoadoutData> {
        return {
            id: this.ID,
            name: this.Name,
            armor: this.Armor.map(x => this.to_packed_ref(x)),
            gear: this.Gear.map(x => this.to_packed_ref(x)),
            weapons: this.Weapons.map(x => this.to_packed_ref(x)),
            extendedGear: this.ExtendedGear.map(x => this.to_packed_ref(x)),
            extendedWeapons: this.ExtendedWeapons.map(x => this.to_packed_ref(x)),
        };
    }

    // Adds an item to the first free slot it can find
    /*
    Add(item: PilotArmor | PilotWeapon | PilotGear) { //, slot: number, extended?: boolean | null): void {
        switch (item.Type) {
            case EntryType.PILOT_ARMOR:
                this.Armor.push(item );
                break;
        case EntryType.PILOT_WEAPON:
            // if (extended) this._extendedWeapons.splice(slot, 1, item as PilotWeapon);
            // else this._weapons.splice(slot, 1, item as PilotWeapon);
            this.Weapons.push(item);
            break;
        case EntryType.PILOT_GEAR:
            // if (extended) this._extendedGear[slot] = item as PilotGear;
            // else this._gear.splice(slot, 1, item as PilotGear);
            this.Gear.push(item );
            break;
        default:
            break;
    }
            */
}
