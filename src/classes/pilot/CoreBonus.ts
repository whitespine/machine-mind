import { CompendiumItem, ItemType, Manufacturer } from "@/class";
import { store } from "@/hooks";

import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ICompendiumItemData } from "@/interface";
import { IEquippable, IIntegrated } from '../CompendiumItem';

export interface ICoreBonusData extends IEquippable, IIntegrated, ICounted {
  id: string,
  name: string,
  source: string, // must be the same as the Manufacturer ID to sort correctly
  effect: string, // v-html
  description: string, // v-html
  mounted_effect?: string
  actions?: IActionData[] | null,
  bonuses?: IBonusData[] | null
  synergies?: ISynergyData[] | null
  deployables?: IDeployableData[] | null,
  counters?: ICounterData[] | null,
  integrated?: string[]
}
export class CoreBonus extends CompendiumItem {
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
        let v = store.compendium.getReferenceByID("Manufacturers", this._source);
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
        let v = store.compendium.getReferenceByID("CoreBonuses", id);
        return v;
    }
}
