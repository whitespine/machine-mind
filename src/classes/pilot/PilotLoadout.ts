import { PilotArmor, PilotWeapon, PilotGear, PilotEquipment, Bonus, Synergy } from "@src/class";
import { defaults } from "@src/funcs";
import { EntryType, LiveEntryTypes, OpCtx, Registry, RegRef, RegSer } from "@src/registry";
import { merge_defaults } from "../default_entries";

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

export interface RegPilotLoadoutData {
    lid: string;
    name: string;
    armor: (RegRef<EntryType.PILOT_ARMOR> | null)[]; // Accounts for gaps in the inventory slots.... Were it my call this wouldn't be how it was, but it ain't my way
    weapons: (RegRef<EntryType.PILOT_WEAPON> | null)[];
    gear: (RegRef<EntryType.PILOT_GEAR> | null)[];
    extendedWeapons: (RegRef<EntryType.PILOT_WEAPON> | null)[];
    extendedGear: (RegRef<EntryType.PILOT_GEAR> | null)[];
}

export class PilotLoadout extends RegSer<RegPilotLoadoutData> {
    LID!: string;
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
    // public get Integrated(): RegEntry<any>[] {
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

    private to_packed_ref(item: PilotEquipment | null): PackedPilotEquipmentState | null {
        // WIP: For to-compcon  syncing
        if (item == null) return null;

        return {
            // TODO: apply the other details
            cascading: false,
            customDamageType: null,
            destroyed: false,
            id: item.LID,
            uses: 0,
        };
    }

    public async load(data: RegPilotLoadoutData): Promise<void> {
        merge_defaults(data, defaults.PILOT_LOADOUT());
        // Simple
        this.Name = data.name;
        this.LID = data.lid;

        // We're a little inconvenienced by the interspersing of nulls, but its not too big a deal
        this.Armor = await Promise.all(
            data.armor.map(a =>
                a ? this.Registry.resolve(this.OpCtx, a, { wait_ctx_ready: false }) : null
            )
        );
        this.Gear = await Promise.all(
            data.gear.map(a =>
                a ? this.Registry.resolve(this.OpCtx, a, { wait_ctx_ready: false }) : null
            )
        );
        this.Weapons = await Promise.all(
            data.weapons.map(a =>
                a ? this.Registry.resolve(this.OpCtx, a, { wait_ctx_ready: false }) : null
            )
        );
        this.ExtendedGear = await Promise.all(
            data.extendedGear.map(a =>
                a ? this.Registry.resolve(this.OpCtx, a, { wait_ctx_ready: false }) : null
            )
        );
        this.ExtendedWeapons = await Promise.all(
            data.extendedWeapons.map(a =>
                a ? this.Registry.resolve(this.OpCtx, a, { wait_ctx_ready: false }) : null
            )
        );
    }

    protected save_imp(): RegPilotLoadoutData {
        return {
            lid: this.LID,
            name: this.Name,
            armor: this.Armor.map(a => a?.as_ref() ?? null),
            gear: this.Gear.map(a => a?.as_ref() ?? null),
            weapons: this.Weapons.map(a => a?.as_ref() ?? null),
            extendedGear: this.ExtendedGear.map(a => a?.as_ref() ?? null),
            extendedWeapons: this.ExtendedWeapons.map(a => a?.as_ref() ?? null),
        };
    }

    public static async unpack(
        data: PackedPilotLoadoutData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<PilotLoadout> {
        let armor = await Promise.all(
            data.armor.map(a => PilotLoadout.resolve_state_item(reg, ctx, a, EntryType.PILOT_ARMOR))
        );
        let gear = await Promise.all(
            data.gear.map(a => PilotLoadout.resolve_state_item(reg, ctx, a, EntryType.PILOT_GEAR))
        );
        let extended_gear = await Promise.all(
            data.extendedGear.map(a =>
                PilotLoadout.resolve_state_item(reg, ctx, a, EntryType.PILOT_GEAR)
            )
        );
        let weapons = await Promise.all(
            data.weapons.map(a =>
                PilotLoadout.resolve_state_item(reg, ctx, a, EntryType.PILOT_WEAPON)
            )
        );
        let extended_weapons = await Promise.all(
            data.extendedWeapons.map(a =>
                PilotLoadout.resolve_state_item(reg, ctx, a, EntryType.PILOT_WEAPON)
            )
        );

        function reffer<T extends EntryType>(
            dat: Array<LiveEntryTypes<T> | null>
        ): Array<RegRef<T> | null> {
            let result: Array<RegRef<T> | null> = [];
            for (let d of dat) {
                if (d) {
                    let ref = d.as_ref() as RegRef<T>;
                    result.push(ref);
                } else {
                    result.push(null);
                }
            }
            return result;
        }

        let reg_dat: RegPilotLoadoutData = {
            lid: data.id,
            name: data.name,
            armor: reffer(armor),
            gear: reffer(gear),
            weapons: reffer(weapons),
            extendedGear: reffer(extended_gear),
            extendedWeapons: reffer(extended_weapons),
        };
        return new PilotLoadout(reg, ctx, reg_dat);
    }

    private static async resolve_state_item<T extends EntryType>(
        reg: Registry,
        ctx: OpCtx,
        item_state: PackedPilotEquipmentState | null,
        expect_type: T
    ): Promise<LiveEntryTypes<T> | null> {
        // Simple case
        if (item_state == null) {
            return null;
        }
        // Get the item
        let item = await reg
            .get_cat(expect_type)
            .lookup_lid_live(ctx, item_state.id, { wait_ctx_ready: false });
        if (!item) {
            console.warn(`Could not resolve item ${item_state.id}`);
            return null;
        } else if (item.Type != expect_type) {
            console.warn(
                `ID ${item_state.id} resolved to invalid slot-equippable type ${item.Type}`
            );
            return null;
        }
        // TODO: apply the other details
        /*
            id: string;
            destroyed: boolean;
            uses: number;
            cascading: false;
            customDamageType: null;
        */
        return item;
    }

    public async emit(): Promise<PackedPilotLoadoutData> {
        let armor: PackedPilotEquipmentState[] = this.EquippedArmor.map(ea => ({
            id: ea.LID,
            destroyed: false,
            cascading: false,
            uses: ea.Uses,
            customDamageType: null,
        }));
        let gear: PackedPilotEquipmentState[] = this.EquippedGear.map(ea => ({
            id: ea.LID,
            destroyed: false,
            cascading: false,
            uses: ea.Uses,
            customDamageType: null,
        }));
        let weapons: PackedPilotEquipmentState[] = this.EquippedWeapons.map(ea => ({
            id: ea.LID,
            destroyed: false,
            cascading: false,
            uses: ea.Uses,
            customDamageType: null,
        }));

        return {
            armor,
            gear: gear.slice(0, 3),
            extendedGear: gear.slice(3, 5),
            weapons: weapons.slice(0, 2),
            extendedWeapons: weapons.slice(2, 4),
            id: this.LID,
            name: this.Name,
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
