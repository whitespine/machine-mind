import { MechWeapon, FittingSize } from "@/class";
import { IWeaponSlotData } from "@/interface";
import _ from "lodash";

import { WeaponMod } from "@/class";
import { store } from "@/hooks";

export class WeaponSlot {
    private _size: FittingSize;
    private _weapon: MechWeapon | null;

    public constructor(size: FittingSize) {
        this._size = size;
        this._weapon = null;
    }

    private save(): void {
        store.pilots.saveData();
    }

    public get Size(): FittingSize {
        return this._size;
    }

    public get Weapon(): MechWeapon | null {
        return this._weapon || null;
    }

    public get Mod(): WeaponMod | null {
        return this.Weapon && this.Weapon.Mod;
    }

    public EquipWeapon(weapon: MechWeapon): void {
        const w = _.cloneDeep(weapon);
        this._weapon = weapon;
        this.save();
    }

    public UnequipWeapon(): void {
        this._weapon = null;
        this.save();
    }

    public static Serialize(ws: WeaponSlot): IWeaponSlotData {
        return {
            size: ws.Size,
            weapon: ws.Weapon ? MechWeapon.Serialize(ws.Weapon) : null,
        };
    }

    public static Deserialize(slotData: IWeaponSlotData): WeaponSlot {
        const ws = new WeaponSlot(slotData.size as FittingSize);
        if (slotData.weapon) {
            const ew = MechWeapon.Deserialize(slotData.weapon);
            if (ew) ws.EquipWeapon(ew);
        }
        return ws;
    }
}
