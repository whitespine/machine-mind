import { ItemType, Action, Bonus, Synergy, Deployable, Counter } from "@/class";
import { ICounterData, IActionData, IDeployableData, IBonusData, ISynergyData } from "@/interface";
import _ from "lodash";
import { store } from "@/hooks";
import { ITagData } from './GeneralInterfaces';
import { Tag } from './Tag';
import { DamageType } from './enums';

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew

// Simplifies serialization implementation to be more generally consistent. Many of the more common 
export abstract class Mixin<T> {
    constructor(){}

    public abstract load(data: T): void;
    public abstract save(): T;
}

// Represents something that is stored / searchable in the compendium
export interface IMMItemData {
    // The display name
    name: string;

    // The description
    description?: string | null;
}

export interface ICompendiumItemData extends IMMItemData  {
    id: string; // Id within the pack
    brew: string; // Homebrew pack it came from -- note that we must generate this ourselves, typically, as it is not in the provided data (it is instead derived by where thaat data comes from!)
    item_type: ItemType; // The type of the item -- note that we must generate this ourselves, typically, based on where we find it
}

// Represents something tied to a license
export interface ILicensed {
  source: string, // Manufacturer ID
  license: string, // Frame Name
  license_level: number, // set to 0 to be available to all Pilots
}

export class MixLicensed extends Mixin<ILicensed> {
    private _source: string = "";
    private _license: string = "";
    private _license_level: number = 0; 
    public get Source(): string { return this._source; }
    public get License(): string { return this._license; }
    public get LicenseLevel(): number { return this._license_level; }

    public load(data: ILicensed) {
        this._source = data.source;
        this._license = data.license;
        this._license_level = data.license_level;
    }

    public save(): ILicensed {
        return {
            license: this.License,
            license_level: this.LicenseLevel,
            source: this.Source
        }
    }
}



// For items that have deployables
export interface IHasDeployables {
  deployables?: IDeployableData[] | null,
}



export class MixDeployables extends Mixin<IHasDeployables> {
    private _deployables: Deployable[] = [];
    public get list(): readonly Deployable[] { return this._deployables; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Deployable> {
        return this._deployables[Symbol.iterator]();
    }
    
    public load(data: IHasDeployables) {
        this._deployables = data.deployables?.map(a => new Deployable(a)) || [];
    }

    public save(): IHasDeployables {
        return {
            deployables: this._deployables.map(d => d.Serialize())
        }
    }
}


// If it has integrated items (a list of IDs of systems/weapons that should be included with this item. Be wary of cyclic data)
export interface IHasIntegrated {
  integrated?: string[] | null
}

export class MixIntegrated extends Mixin<IHasIntegrated> {
    private _integrated: string[] = [];
    public get list(): readonly string[] { return this._integrated; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<string> {
        return this._integrated[Symbol.iterator]();
    }
    
    public load(data: IHasIntegrated) {
        this._integrated = data.integrated || [];
    }

    public save(): IHasIntegrated {
        return {
            integrated: [...this._integrated]
        }
    }
}

// Item can have tags
export interface IHasTags {
  tags?: ITagData[] | null
}

export class MixTags extends Mixin<IHasTags> {
    private _tags: Tag[] = [];
    public get list(): readonly Tag[] { return this._tags; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Tag> {
        return this._tags[Symbol.iterator]();
    }
    
    public load(data: IHasTags) {
        this._tags = Tag.Deserialize(data.tags || []);
    }

    public save(): IHasTags {
        return {
            tags: this._tags.map(t => t.SerializeInstance())
        }
    }
}

// Item can have counters
export interface IHasCounters {
  counters?: ICounterData[] | null
}

export class MixCounters extends Mixin<IHasCounters> {
    private _counters: Counter[] = [];
    public get Counters(): readonly Counter[] { return this._counters; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Counter> {
        return this._counters[Symbol.iterator]();
    }

    public load(data: IHasCounters ) {
        this._counters = data.counters?.map(c => new Counter(c)) || [];
    }

    public save(): IHasCounters {
        return {
            counters: this._counters.map(c => c.Serialize())
        }
    }
}

// Include for flavored items
export interface IHasFlavor {
    flavorName?: string | null;
    flavorDescription?: string | null;
}

export class MixFlavor extends Mixin<IHasFlavor> {
    private _name: string | null = null;
    private _description: string | null = null;
    public get Name(): string | null { return this._name; }
    public get Description(): string | null { return this._description; }

    public load(data: IHasFlavor) {
        this._name = data.flavorDescription || null;
        this._name = data.flavorName || null;
    }

    public save(): IHasFlavor {
        return {
            flavorDescription: this.Description,
            flavorName: this.Name
        }
    }
}

// Include user data, e.g. notes, damage types
export interface IUserNoted {
    note?: string | null;
    customDamageType?: DamageType | null;
}

export class MixUserNoted extends Mixin<IUserNoted> {
    public get Note(): string | null { return this._note; }
    public get CustomDamageType(): DamageType | null { return this._custom_damage_type; }
    private _custom_damage_type: DamageType | null = null
    private _note: string | null = null

    public load(data: IUserNoted) {
        this._note = data.note || null;
        this._custom_damage_type = data.customDamageType || null;
    }

    public save(): IUserNoted {
        return {
            customDamageType: this.CustomDamageType,
            note: this.Note
        }
    }
}

// Hosts mixins. Expects nothing from its children, except note that you MUST call register-mixins and then load if you want anything real to happen
export abstract class MixinHost<D extends (object)> {
    private _mixins: Mixin<any>[] = [];


    // Add mixins. Should do in constructor of child classes
    protected register_mixins(mixins: Array<Mixin<any>>) {
        this._mixins = mixins;
    }

    // Save all data from all mixins
    public save(): D  {
        let result = this.serialize_self();
        for(let m of this._mixins) {
            Object.assign(result, m.save());
        }

        // We've filled it
        return result as D;
    }

    // This is how we emit non-mixin data. Subclasses should override with super calls as appropriate
    protected abstract serialize_self(): Partial<D>;

    // Makes a copy by serializing and de-serializing
    public clone(): this {
        let data = this.save();

        // TS gets a bit messy here, but so long as our mixins keep to the standard call sig's it should be fine
        let nv = (this as any).constructor(data) as this;
        return nv;
    }

    // Load data to this and to all mixins
    protected load(data: D) {
        for(let m of this._mixins) {
            m.load(data);
        }
    }
}

// Has names and description - this is for any item that might be displayed, but is not necessarily in the compendium
export class MMItem<D extends  (object & IMMItemData)> extends MixinHost<D> {
    private _name: string;
    private _description: string | null; // v-html

    public constructor(data: D) {
        super();

        // Setup basics. Children have to handle mixins themselves, unfortunately
        this._name = data.name;
        this._description = data.description || null;
    } 
    
    protected serialize_self(): Partial<D> {
        let mm = {
            name: this._name,
            description: this._description
        } as Partial<D>;
        return mm; 
    }

    public get Name(): string {
        return this._name;
    }

    public set Name(val: string) {
        this._name = val;
        this.save();
    }

    public get Description(): string | null {
        return this._description;
    }

    public set Description(val: string | null) {
        this._description = val;
        this.save();
    }
}

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