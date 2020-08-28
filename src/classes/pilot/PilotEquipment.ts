import { CompendiumItem, Tag } from "@/class";
import { ICompendiumItemData } from "@/interface";
import { IEquipmentData, ITagData } from "../GeneralInterfaces";
import { store } from "@/hooks";
import { IPilotWeaponData } from './PilotWeapon';
import { IPilotArmorData } from './PilotArmor';
import { IPilotGearData } from './PilotGear';

export type IPilotEquipmentData = IPilotWeaponData | IPilotArmorData | IPilotGearData;

export abstract class PilotEquipment extends CompendiumItem {
    private _tags: ITagData[];
    protected current_uses: number | null | undefined;
    protected _custom_damage_type: string | null;

    public constructor(equipmentData: IPilotEquipmentData) {
        super(equipmentData);
        this._tags = equipmentData.tags || [];
        this._custom_damage_type = null;
        this.current_uses = 0;
    }

    protected save(): void {
        store.pilots.saveData();
    }

    public get Tags(): Tag[] {
        return Tag.Deserialize(this._tags);
    }
    public static Serialize(item: PilotEquipment | null): IEquipmentData | null {
        if (!item) return null;
        return {
            id: item.ID,
            destroyed: false,
            uses: item.current_uses,
            cascading: false,
            note: item.Note,
            flavorName: item._flavor_name,
            flavorDescription: item._flavor_description,
            customDamageType: item._custom_damage_type || null,
        };
    }

    public static Deserialize(itemData: IEquipmentData | null): PilotEquipment | null {
        if (!itemData) return null;
        const item = store.compendium.instantiate("PilotEquipment", itemData.id);
        item.current_uses = itemData.uses;
        item._note = itemData.note;
        item._flavor_name = itemData.flavorName;
        item._flavor_description = itemData.flavorDescription;
        item._custom_damage_type = itemData.customDamageType || null;
        return item;
    }
}
