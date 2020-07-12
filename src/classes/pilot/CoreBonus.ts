import { CompendiumItem, ItemType, Manufacturer } from "@/class";
import { store } from "@/hooks";

import { ICompendiumItemData } from "@/interface";

interface ICoreBonusData extends ICompendiumItemData {
    source: string;
    effect: string;
    mounted_effect?: string | null;
}

class CoreBonus extends CompendiumItem {
    private _source: string;
    private _effect: string;
    private _mounted_effect: string;

    public constructor(cbData: ICoreBonusData) {
        super(cbData);
        this._source = cbData.source;
        this._effect = cbData.effect;
        this._mounted_effect = cbData.mounted_effect || "";
        this._item_type = ItemType.CoreBonus;
    }

    public get Source(): string {
        return this._source;
    }

    public get Manufacturer(): Manufacturer {
        let v = store.datastore.getReferenceByID("Manufacturers", this._source);
        return v;
    }

    public get Effect(): string {
        return this._effect;
    }

    public get IsMountable(): boolean {
        return !!this.MountedEffect;
    }

    public get MountedEffect(): string {
        return this._mounted_effect;
    }

    public static Deserialize(id: string): CoreBonus {
        let v = store.datastore.getReferenceByID("CoreBonuses", id);
        return v;
    }
}

export { CoreBonus, ICoreBonusData };
