import { ItemType, Deployable, DamageType } from '@/class';
import { IDeployableData } from '@/interface';
import { mixin } from 'lodash';
import { read } from 'fs';

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

/*
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
*/


// Handles a single item
export class Mixlet<Host, HostKey extends keyof Host, Src extends object, SrcName extends keyof Src> {
    // What key we expose in the actual class
    public prop_key: HostKey;

    // What we key save/load from in raw json data
    public src_key: SrcName;

    // Our current held data
    public val: Host[HostKey];

    // Writes data to compendium/saves etc like so
    public writer: (x: Host[HostKey]) => Src[SrcName];

    // Reads data from compendium pack/saves like so
    public reader: (x: Src[SrcName]) => Host[HostKey];

    // Here for overriding purposes
    public get_val(v: Host[HostKey]) {
        return v;
    }
    public set_val(v: Host[HostKey]) {
        this.val = v;
    }

    // Constructor is straightforward enough
    public constructor(prop_key: HostKey, src_key: SrcName, default_val: Host[HostKey], reader: (x: Src[SrcName]) => Host[HostKey], writer: (x: Host[HostKey]) => Src[SrcName]) {
        this.prop_key = prop_key;
        this.src_key = src_key;
        this.val = default_val;
        this.reader = reader;
        this.writer = writer; 
    }

    // Loads this mixlet from the specified raw data
    public load(from: Src) {
        this.val = this.reader(from[this.src_key]);
        return this;
    }

    // Writes this mixlet to the specified raw data
    public save(to: Src) {
        to[this.src_key] = this.writer(this.val);
    }
}

type AnyMixlet<HostType, SrcType extends object> = Mixlet<HostType, any, SrcType, any>;

export interface MixinHostData<SrcType extends object> {
    // Keep our mixins nice and tidy
    _mix_list: Array<AnyMixlet<this, SrcType>>;
    _mix_map: Map<string, AnyMixlet<this, SrcType>>;
    _query_val(key: string): any | undefined;
    _set_val(key: string, val: any): boolean;

    // Just have each mixin write out
    Serialize(): SrcType;

    // Just have each mixin read in. Return self
    Deserialize(x: SrcType): this;
}

// We add this into our item prior to proxying it
function pour_mixins<HostType extends MixinHostData<SrcType>, SrcType extends object>(target_: Partial<HostType>, mixins: Array<AnyMixlet<HostType, SrcType>>) {
    // We just assume we're all good, lol
    let target = target_ as HostType;

    // Set up quick lookup stuff
    target._mix_list = mixins;

    // Map out our mixins for faster lookup
    target._mix_map = new Map();
    for(let mix of mixins) {
        target._mix_map.set(mix.prop_key, mix);
    }

    // Return the requested value, if we can find it
    target._query_val = (key: string) => target._mix_map.get(key)?.val;

    // Set the requested value, if we can find it. Return success. We trust outer typing to handle types
    target._set_val = (key: string, val: any) => {
        let found = target._mix_map.get(key);
        if(found) {
            found.set_val(val);
            return true;
        } else {
            return false;
        }
    }

    // Just have each mixin write out
    target.Serialize = () => {
        let x = {} as SrcType;
        for(let m of target._mix_list) {
            m.save(x);
        }
        return x;
    }

    // Just have each mixin read in
    target.Deserialize = (x: SrcType) => {
        for(let m of target._mix_list) {
            m.load(x);
        }
    }
}

// This static object just wraps our behavior on concretes
const handler: ProxyHandler<MixinHostData<any>> = {
    get: (target, key) => {
        if(typeof key === "string") {
            return target._query_val(key);
        } else {
            return undefined;
        }
    },
    set: (target, key, value, receiver) => {
        if(typeof key === "string") {
            return target._set_val(key, value);
        } else {
            return false;
        }
    }
};

// Just a wrapper around the functionality of making a properly proxied ConcreteMix easily
export class MixBuilder<HostType extends MixinHostData<SrcType>, SrcType extends object> {
    // Track our mixins
    private mix_list: Array<AnyMixlet<HostType, SrcType>> = [];

    // Track our wip
    private host: Partial<HostType>;

    constructor(host: Partial<HostType>) {
        this.host = host;
    }

    // Add a new prop to the proxy
    with<HostName extends keyof HostType, SrcName extends keyof SrcType>(mixlet: Mixlet<HostType, HostName, SrcType, SrcName>): this {
        this.mix_list.push(mixlet);
        return this;
    }

    // Finish it off. You'll need to AS it appropriately
    finalize(): HostType {
        // Copy the array just to remove any potential lingering "this" connotations. Hopefully js garbage collection is smart enough to ignore it, but proxies are weird
        let mix_list = [...this.mix_list];

        // Create the concrete
        pour_mixins(this.host, mix_list);

        // Create our proxy
        let rv = new Proxy(this.host as HostType, handler);
        return rv;
    }

}

// A simple example
interface Raw {
    raw_actions: number[]
}
interface Ract {
    actions: string[]
}

let x = new Mixlet<Ract, "actions", Raw, "raw_actions">("actions", "raw_actions", [], (x: number[]) => x.map(e => ""+e),  (y: string[]) => y.map(Number.parseInt));