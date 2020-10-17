import {
    Rules,
    PilotArmor,
    PilotWeapon,
    PilotGear,
    Loadout,
    EntryType,
    PilotEquipment
} from "@/class";
import { IPilotArmorData, IPilotGearData, IPilotWeaponData } from '@/interface';
import { ident, MixBuilder, RWMix, MixLinks, uuid } from '@/mixmeta.typs';
import { CreatePilotArmor, CreatePilotGear, CreatePilotWeapon } from './PilotEquipment';

export interface IPilotLoadoutData {
    id: string;
    name: string;
    armor: (IPilotArmorData | null)[]; // Accounts for gaps in the inventory slots.... Were it my call this wouldn't be how it was, but it ain't my way
    weapons: (IPilotWeaponData | null)[];
    gear: (IPilotGearData | null)[];
    extendedWeapons: (IPilotWeaponData | null)[];
    extendedGear: (IPilotGearData | null)[];
}

export interface PilotLoadout extends MixLinks<IPilotLoadoutData> {
    ID: string;
    Name: string;
    Armor: PilotArmor[];
    Gear: PilotGear[];
    Weapons: PilotWeapon[];
    // ExtendedWeapons: PilotWeapon[];
    // ExtendedGear: PilotGear[];

    // Methods
    Items(): PilotEquipment[];
    Add(item: PilotEquipment): void;
    // Remove();

    CanAddArmor(): boolean;
    CanAddWeapons(): boolean;
    CanAddGear(): boolean;
}

export function CreatePilotLoadout(data: IPilotLoadoutData) {
    let mb = new MixBuilder<PilotLoadout, IPilotLoadoutData>({
        CanAddArmor,
        Add,
        Items, 
        CanAddGear,
        CanAddWeapons
    });
    mb.with(new RWMix("ID","id", ident, ident));
    mb.with(new RWMix("Name","name", ident, ident));
    mb.with(new RWMix("Armor","armor", (d) => (d || []).filter(x => x).map(x => CreatePilotArmor(x)), (v) => v.map(x => x.Serialize())));
    mb.with(new RWMix("Weapons","weapons", (d) => (d || []).filter(x => x).map(x => CreatePilotWeapon(x)), (v) => v.map(x => x.Serialize())));
    mb.with(new RWMix("Gear","gear", (d) => (d || []).filter(x => x).map(x => CreatePilotGear(x)), (v) => v.map(x => x.Serialize())));


    return mb.finalize(data);
}



    function Items(this: PilotLoadout): PilotEquipment[] {
        return (this.Armor as PilotEquipment[])
            .concat(this.Weapons as PilotEquipment[])
            .concat(this.Gear as PilotEquipment[]);
    }

function CanAddArmor(this: PilotLoadout) {
    return this.Armor.length < Rules.MaxPilotArmor;
}
function CanAddWeapons(this: PilotLoadout) {
    return this.Weapons.length < Rules.MaxPilotWeapons;
}
function CanAddGear(this: PilotLoadout) {
    return this.Gear.length < Rules.MaxPilotGear;
}

function Add(this: PilotLoadout, item: PilotEquipment) { //, slot: number, extended?: boolean | null): void {
    switch (item.Type) {
        case EntryType.PilotArmor:
            this.Armor.push(item as PilotArmor);
            break;
        case EntryType.PilotWeapon:
            // if (extended) this._extendedWeapons.splice(slot, 1, item as PilotWeapon);
            // else this._weapons.splice(slot, 1, item as PilotWeapon);
            this.Weapons.push(item as PilotWeapon);
            break;
        case EntryType.PilotGear:
            // if (extended) this._extendedGear[slot] = item as PilotGear;
            // else this._gear.splice(slot, 1, item as PilotGear);
            this.Gear.push(item as PilotGear);
            break;
        default:
            break;
    }
}


/*
    public Remove(item: PilotEquipment, slot: number, extended?: boolean | null): void {
        switch (item.EntryType) {
            case EntryType.PilotArmor:
                if (this._armor[slot]) this._armor[slot] = null;
                break;
            case EntryType.PilotWeapon:
                if (extended) this._extendedWeapons[slot] = null;
                if (this._weapons[slot]) this._weapons[slot] = null;
                break;
            case EntryType.PilotGear:
                if (extended) this._extendedGear[slot] = null;
                if (this._gear[slot]) this._gear[slot] = null;
                break;
            default:
                break;
        }
        this.save();
    }

    public static Serialize(pl: PilotLoadout): IPilotLoadoutData {
        return {
            id: pl.ID,
            name: pl.Name,
            armor: pl.Armor.map(x => PilotEquipment.Serialize(x)),
            weapons: pl.Weapons.map(x => PilotEquipment.Serialize(x)),
            gear: pl.Gear.map(x => PilotEquipment.Serialize(x)),
            extendedWeapons: pl.ExtendedWeapons.map(x => PilotEquipment.Serialize(x)),
            extendedGear: pl.ExtendedGear.map(x => PilotEquipment.Serialize(x)),
        };
    }

    public static Deserialize(loadoutData: IPilotLoadoutData): PilotLoadout {
        const loadout = new PilotLoadout(0, loadoutData.id);
        loadout.ID = loadoutData.id;
        loadout._name = loadoutData.name;
        loadout._armor = loadoutData.armor.map(x => PilotEquipment.Deserialize(x) as PilotArmor);
        loadout._weapons = loadoutData.weapons.map(
            x => PilotEquipment.Deserialize(x) as PilotWeapon
        );
        loadout._gear = loadoutData.gear.map(x => PilotEquipment.Deserialize(x) as PilotGear);
        loadout._extendedWeapons = loadoutData.extendedWeapons
            ? loadoutData.extendedWeapons.map(x => PilotEquipment.Deserialize(x) as PilotWeapon)
            : Array(1).fill(null);
        loadout._extendedGear = loadoutData.extendedGear
            ? loadoutData.extendedGear.map(x => PilotEquipment.Deserialize(x) as PilotGear)
            : Array(2).fill(null);
        return loadout;
    }
}

*/