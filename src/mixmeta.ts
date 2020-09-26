import { ItemType, Deployable, DamageType } from '@/class';
import { IDeployableData } from '@/interface';
import { uniqueId } from 'lodash';
import { keys } from 'ts-transformer-keys';

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

// Handles a single item
export class Mixlet<Host, HostKey extends keyof Host, Src extends object, SrcName extends keyof Src> {
    // What key we expose in the actual class
    public prop_key: HostKey;

    // What we key save/load from in raw json data
    public src_key: SrcName;

    // Our current held data
    public val: Host[HostKey];

    // Our fallback if we can't read
    public default_val: Host[HostKey];

    // Flag demarcates if we were able to legitimately load data, or if we just used the default due to undefined
    private defined: boolean = false;

    // Writes data to compendium/saves etc like so
    public writer: (x: Host[HostKey]) => Src[SrcName];

    // Reads data from compendium pack/saves like so. Uses default if value not present/null
    public reader: (x: NonNullable<Src[SrcName]>) => Host[HostKey];

    // Here for overriding purposes
    public get_val(v: Host[HostKey]) {
        return v;
    }
    public set_val(v: Host[HostKey]) {
        this.defined = true; // Clearly it is being explicitly set, so....
        this.val = v;
    }

    // Constructor is straightforward enough
    public constructor(prop_key: HostKey, src_key: SrcName, default_val: Host[HostKey], reader: (x: NonNullable<Src[SrcName]>) => Host[HostKey], writer: (x: Host[HostKey]) => Src[SrcName]) {
        this.prop_key = prop_key;
        this.src_key = src_key;
        this.val = default_val;
        this.default_val = default_val;
        this.reader = reader;
        this.writer = writer; 
    }

    // Loads this mixlet from the specified raw data
    public load(from: Src) {
        let raw: Src[SrcName] | undefined | null = from[this.src_key];

        // Silently promotes undefineds (IE not provided) to nulls. I think this might be a blindspot in typescripts checking
        if(raw === undefined) {
            this.val = this.default_val;
            this.defined = false;
         }else if( raw === null) {
            this.val = this.default_val;
            this.defined = true; // Null is at least an explicit val
        } else {
            this.val = this.reader(raw as NonNullable<Src[SrcName]>);
            this.defined = true;
        }

        this.val = this.reader(raw);
    }

    // Writes this mixlet to the specified raw data
    public save(to: Src) {
        if(this.defined) {
            to[this.src_key] = this.writer(this.val);
        }
    }
}

type AnyMixlet<HostType, SrcType extends object> = Mixlet<HostType, any, SrcType, any>;

// This interface should be extended by any interface representing a mix amalgam, with the SrcType being the IWhatever that it saves/loads from
export interface MixLinks<SrcType extends object> {
    // Keep our mixlets nice and tidy
    _mix_list: Array<AnyMixlet<this, SrcType>>;
    _mix_map: Map<string, AnyMixlet<this, SrcType>>;
    _query_val(key: string): [boolean, any | undefined]; // First is success, second is value
    _set_val(key: string, val: any): boolean;

    // Add mixlets dynamically, useful if we want to add things outside of the standard builder
    _add_mixlet(mixlet: AnyMixlet<this, SrcType>);

    // Just have each mixlet write out
    Serialize(): SrcType;

    // Just have each mixlet read in. Return self
    Deserialize(x: SrcType): this;
}

// We add this into our item prior to proxying it
export function pour_mixlets<HostType extends MixLinks<SrcType>, SrcType extends object>(target_: Partial<HostType>, mixlets: Array<AnyMixlet<HostType, SrcType>>) {
    // We just assume we're all good, lol
    let target = target_ as HostType;

    // Init mixlet holders
    target._mix_list = [];
    target._mix_map = new Map();

    // Setup add capability
    target._add_mixlet = (mixlet) => {
        target._mix_list.push(mixlet);
        target._mix_map.set(mixlet.prop_key, mixlet);
    }

    // Add all
    for(let m of mixlets) {
        target._add_mixlet(m);
    }

    // Setup query. Return the requested value, if we can find it
    target._query_val = (key: string) => {
        let r = target._mix_map.get(key);
        if(r !== undefined) {
            return [true, r.val];
        } else {
            return [false, undefined];
        }
    }

    // Setup set (up, dog!). Set the requested value, if we can find it. Return success. We trust outer typing to handle types
    target._set_val = (key: string, val: any) => {
        let found = target._mix_map.get(key);
        if(found) {
            found.set_val(val);
            return true;
        } else {
            return false;
        }
    }

    // Just have each mixlet write out
    target.Serialize = () => {
        let x = {} as SrcType;
        for(let m of target._mix_list) {
            m.save(x);
        }
        return x;
    }

    // Just have each mixlet read in
    target.Deserialize = (x: SrcType) => {
        for(let m of target._mix_list) {
            m.load(x);
        }
        return target;
    }
}

// This static object just wraps our behavior on concretes
const handler: ProxyHandler<MixLinks<any>> = {
    get: (target, key) => {
        if(typeof key === "string") {
            // Check mixin first, fallback to key (for Serialize, methods, etc)
            let queried = target._query_val(key);
            if(queried[0]) { 
                return queried[1]; 
            } else {
                return target[key];
            }
        } else {
            return undefined;
        }
    },
    // We don't allow setting any way except by mixin.
    set: (target, key, value, receiver) => {
        if(typeof key === "string") {
            return target._set_val(key, value);
        } else {
            return false;
        }
    }
};

// Note on augmentors: x is partial. we do not denote it as such for convenience, but it is
export type Augmentor<HostType> = (x: HostType) => any;

// Just a wrapper around the functionality of making a properly proxied ConcreteMix easily
export class MixBuilder<HostType extends MixLinks<SrcType>, SrcType extends object> {
    // Track our mixlets
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

    // An alternate syntax to the above, designed for more general purpose operations
    augment(augmentor: Augmentor<HostType>): this {
        augmentor(this.host as HostType);    
        return this;
    }

    // Lets us add data pre-finalize without exposing our inner item
    // Note that because they are added this way they will NOT be mixed!
    fnset<K extends keyof HostType>(key: K, val: HostType[K]) {
        this.host[key] = val;
    }

    // Finish it off. Deserialize if data provided
    finalize(data: SrcType | null): HostType {
        // Copy the array just to remove any potential lingering "this" connotations. Hopefully js garbage collection is smart enough to ignore it, but proxies are weird
        let mix_list = [...this.mix_list];

        // Create the concrete
        pour_mixlets(this.host, mix_list);

        // Create our proxy
        let rv = new Proxy(this.host as HostType, handler);

        // Validate
        validate_props<HostType>(rv);

        // Deserialize
        if(data) {
            rv.Deserialize(data);
        }

        // And we done
        return rv;
    }
}

// A simple uuid function
const alphanum = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
function rand_char(): string {
    return alphanum[Math.floor(Math.random() * alphanum.length)];
}

export function uuid(): string {
    let s = "";
    for(let i=0; i<64; i++) {
        s += rand_char();
    }
    return s;
}

// Duplicating etc
/** 
 * Create an exact copy of a piece of data by serializing then deserializing the data
 */
export function duplicate<V extends MixLinks<T>, T extends object>(x: V): V {
    // TODO: This may be volatile.
    let copy = {...x}; // Copy x, to get its builtin functions for later Deser.
    let deser = x.Serialize();
    copy.Deserialize(deser);
    return x;
}

/**
 * Create an exact copy of a piece of data by serializing then deserializing the data,
 * THEN change the ID
 */
// export function duplicate_renew<V extends MixLinks<T> & {ID: string}, T extends object>(x: V): V {
    // let cp = duplicate(x as any) as V; // Typescript's reasoning can't quite handle this case
    // cp.ID = uuid();
    // return cp;
// }

// This function makes sure all properties were set properly
// Note that it considers undefined to be erroneous. If you want undefined, use null
// Example usage: validate_props(x);
function validate_props<T extends object>(v: T) {
    for(let key of keys<T>()) {
        if(v[key] === undefined) {
            throw new TypeError(`Error! ${v} missing key ${key}`);
        }
    }
}



// Re-export stuff
export function ident<T>(t: T): T { return t; }
export {ActionsMixReader, ActionsMixWriter, FrequencyMixReader, FrequencyMixWriter} from "@/classes/Action";
export {BonusesMixReader as BonusMixReader, BonusesMixWriter as BonusMixWriter} from "@/classes/Bonus";
export {SynergyMixReader, SynergyMixWriter} from "@/classes/Synergy";
export {TagInstanceMixWriter, TagTemplateMixWriter, TagTemplateMixReader, TagInstanceMixReader} from "@/classes/Tag";
export {DeployableMixReader, DeployableMixWriter} from "@/classes/Deployable";
export {DamagesMixReader,DamagesMixWriter } from "@/classes/Damage";
export {RangesMixReader,RangesMixWriter } from "@/classes/Range";



/*
// A simple example
interface Raw {
    raw_actions: number[]
}
interface Ract {
    actions: string[]
}

let x = new Mixlet<Ract, "actions", Raw, "raw_actions">("actions", "raw_actions", [], (x: number[]) => x.map(e => ""+e),  (y: string[]) => y.map(Number.parseInt));
*/