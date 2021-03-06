import { PilotEquipment, ItemType } from "@/class";
import { IPilotEquipmentData } from "@/interface";

export interface IPilotArmorData extends IPilotEquipmentData {
    hp_bonus?: number | null;
    speed?: number | null;
    speed_bonus?: number | null;
    armor?: number | null;
    edef?: number | null;
    edef_bonus?: number | null;
    evasion?: number | null;
    evasion_bonus?: number | null;
}

export class PilotArmor extends PilotEquipment {
    private hp_bonus: number;
    private speed: number;
    private speed_bonus: number;
    private armor: number;
    private edef: number;
    private edef_bonus: number;
    private evasion: number;
    private evasion_bonus: number;

    public constructor(data: IPilotArmorData) {
        super(data);
        this.hp_bonus = data.hp_bonus || 0;
        this.speed = data.speed || 0;
        this.speed_bonus = data.speed_bonus || 0;
        this.armor = data.armor || 0;
        this.edef = data.edef || 0;
        this.edef_bonus = data.edef_bonus || 0;
        this.evasion = data.evasion || 0;
        this.evasion_bonus = data.evasion_bonus || 0;
        this._item_type = ItemType.PilotArmor;
    }

    public get HPBonus(): number {
        return this.hp_bonus;
    }

    public get Speed(): number {
        return this.speed;
    }

    public get SpeedBonus(): number {
        return this.speed_bonus;
    }

    public get Armor(): number {
        return this.armor;
    }

    public get EDefense(): number {
        return this.edef;
    }

    public get EDefenseBonus(): number {
        return this.edef_bonus;
    }

    public get Evasion(): number {
        return this.evasion;
    }

    public get EvasionBonus(): number {
        return this.evasion_bonus;
    }
}
