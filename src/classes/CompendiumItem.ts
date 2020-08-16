import { ItemType } from "@/class";
import { ICounterData } from "@/interface";
import _ from "lodash";
import { store } from "@/hooks";

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew

export const CORE_BREW_ID = "Core";

export interface ICompendiumItemData {
    id: string;
    name: string;
    description: string;
    brew: string; // Homebrew pack it came from
    counters: ICounterData[] | null;
}

export abstract class CompendiumItem {
    private _id: string;
    protected _name: string;
    protected _description: string;
    protected _note: string | null | undefined;
    protected _item_type: ItemType;
    protected _flavor_name: string | null | undefined;
    protected _flavor_description: string | null | undefined;
    protected _brew: string;
    private _err?: string | null;

    public readonly Counters: ICounterData[];

    public constructor(itemData?: ICompendiumItemData | null) {
        if (itemData) {
            this._id = itemData.id;
            this._name = itemData.name;
            this._description = itemData.description;
            this._item_type = ItemType.None;
            this._brew = itemData.brew || CORE_BREW_ID;
            this.Counters = itemData.counters || [];
        } else {
            this._id = this._name = this._description = this._note = this._brew = "";
            this._item_type = ItemType.None;
            this.Counters = [];
            this._err = "Item data not found!";
        }
    }

    protected save(): void {
        store.pilots.saveData();
    }

    public get ID(): string {
        return this._id;
    }

    public get Name(): string {
        return this._flavor_name ? this._flavor_name : this._name;
    }

    public set Name(val: string) {
        this._flavor_name = val;
        this.save();
    }

    public get FlavorName(): string {
        return this._flavor_name || "";
    }

    public get TrueName(): string {
        return this._name;
    }

    public get Description(): string {
        return this._flavor_description ? this._flavor_description : this._description;
    }

    public set Description(val: string) {
        this._flavor_description = val;
        this.save();
    }

    public get ItemType(): ItemType {
        return this._item_type;
    }

    public get Brew(): string {
        return this._brew;
    }

    public get Err(): string {
        return this._err || "";
    }

    public get Note(): string {
        return this._note || "";
    }

    public set Note(note: string) {
        this._note = note;
        this.save();
    }

    public get Icon(): string {
        return "cci-" + _.kebabCase(this.ItemType);
    }

    public get Color(): string {
        return _.kebabCase(this.ItemType);
    }
}
