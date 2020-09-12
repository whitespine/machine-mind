import { ItemType, Action, Bonus, Synergy, Deployable, Counter } from "@/class";
import { ICounterData, IActionData, IDeployableData, IBonusData, ISynergyData } from "@/interface";
import _ from "lodash";
import { DamageType } from './enums';

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew


// Has an ID and type, as well as tracks the brew it came from
export abstract class CompendiumItem<D extends (object & ICompendiumItemData)> extends MMItem<D> {
    private _id: string;
    protected readonly _item_type: ItemType;
    protected _brew: string;

    // As with above, never deviate from this single-item constructor
    public constructor(data: D) {
        // Setup basics
        super(data);
        this._id = data.id;
        this._brew = data.brew;
        this._item_type = data.item_type;
    } 

    public get ID(): string {
        return this._id;
    }

    // Allows you to pick a new ID. TODO: Register with compendium, maybe? I don't really think we should honestly
    public clone(new_id: string | null = null): this {
        let v = super.clone();
        if(new_id) {
            v._id = new_id
        }
        return v;
    }

    // The item type (system, weapon, etc), used for compendium categorization
    public get ItemType(): ItemType {
        return this._item_type;
    }

    // The content pack (or more generally, the source) this came from
    public get Brew(): string {
        return this._brew;
    }

    public set Brew(nv: string) {
         this._brew = nv;
    }

    protected serialize_self(): Partial<D> {
        let result = {
            ...super.serialize_self(),
            id: this._id,
            brew: this._brew
        } as Partial<D>;
        return result;
    }

    // Derived icon id from the item type
    public get Icon(): string {
        return "cci-" + _.kebabCase(this.ItemType);
    }

    // Derived item color from the item type
    public get Color(): string {
        return _.kebabCase(this.ItemType);
    }
}