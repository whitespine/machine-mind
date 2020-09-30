import { keys } from 'ts-transformer-keys';
import {Registry } from './store/compendium';

// Handles a single property in a single item, specifically one that saves/stores from a single
export class RWMix<Host, HostKey extends keyof Host, Src extends object, SrcName extends keyof Src> {
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

    // Hooks. Apply in order.
    private pre_setters: Array<(nv:Host[HostKey]) => Host[HostKey]> = []; // Can override the data that is passed in. If an error is thrown, the write is dropped
    private post_setters: Array<() => any> = []; // Called post set. Should be careful about setting mixlets from here so as to not cause errors

    // Writes data to compendium/saves etc like so
    public writer: (x: Host[HostKey]) => Src[SrcName];

    // Reads data from compendium pack/saves like so. Uses default if value not present/null
    public reader: (x: NonNullable<Src[SrcName]>) => Host[HostKey];

    // Here for overriding purposes
    public get_val(v: Host[HostKey]) {
        return v;
    }
    public set_val(v: Host[HostKey]) {
        // Apply all pre setters
        try {
            for(let s of this.pre_setters) {
                v = s(v);
            }
        } catch(e) {
            console.log(`Dropping set ${this.prop_key} due to encountered error:`, e);
            return;
        }
        this.defined = true; // Clearly it is being explicitly set, so....
        this.val = v;

        // Call all post setters
        for(let s of this.post_setters) {
            s();
        }
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
        let raw: Src[SrcName] | undefined = from[this.src_key];

        // Silently promotes undefineds (IE not provided) to nulls. I think this might be a blindspot in typescripts checking
        if(raw === undefined) {
            this.val = this.default_val;
            this.defined = false;
        } else {
            // It was defined
            this.val = this.reader(raw as NonNullable<Src[SrcName]>);
            this.defined = true;
        }
    }

    // Writes this mixlet to the specified raw data
    public save(to: Src) {
        if(this.defined) {
            to[this.src_key] = this.writer(this.val);
        }
    }

    // Add new hooks
    public add_pre_set_hook(hook: (v: Host[HostKey]) => Host[HostKey]) {
        this.pre_setters.push(hook);
    }

    public add_post_set_hook(hook: () => any) {
        this.post_setters.push(hook);
    }
}

type AnyMixlet<HostType, SrcType extends object> = RWMix<HostType, any, SrcType, any>;

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
function pour_mixlets<HostType extends MixLinks<SrcType>, SrcType extends object>(target_: Partial<HostType>, mixlets: Array<AnyMixlet<HostType, SrcType>>) {
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
const proxy_handler: ProxyHandler<MixLinks<any>> = {
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

// Needed for items that require registry access
export interface InitializationContext {
    brew: string;
    registry: Registry;
}

// Just a wrapper around the functionality of making a properly proxied ConcreteMix easily
export class MixBuilder<HostType extends MixLinks<SrcType>, SrcType extends object> {
    // Track our mixlets
    private mix_list: Array<AnyMixlet<HostType, SrcType>> = [];

    // Track our wip
    private host: Partial<HostType>;

    constructor(host: Partial<HostType>) {
        this.host = host;
    }

    // Add a new prop to the proxy. Return the mixlet for ease of chaining
    with<HostName extends keyof HostType, SrcName extends keyof SrcType>(mixlet: RWMix<HostType, HostName, SrcType, SrcName>): RWMix<HostType, HostName, SrcType, SrcName> {
        this.mix_list.push(mixlet);
        return mixlet;
    }

    // Add a new prop to the proxy that isn't serialized in any way - it is derived at creation time from the finalization context
    // withContextDerived<HostName extends keyof HostType, HostVal extends HostType[HostName]>(key: HostName, generator

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
        let rv = new Proxy(this.host as HostType, proxy_handler);

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

// Helper functions
export function ident<T>(t: T): T { return t; }
export function ident_drop_null<T>(t: T): NonNullable<T> | undefined { 
    return t ?? undefined;
}
export function ser_one<T extends {Serialize(): G}, G>(t: T): G {
    return t.Serialize();
}
export function ser_many<T extends {Serialize(): G}, G>(t: T[]): G[] {
    return t.map(v => v.Serialize());
}

// Easily lock into enums using restrict_enum
export function restrict_choices<T extends string>(choices: T[], default_choice: T): (x: string | undefined) => T {
    return (x: string | undefined) => choices.includes((x || "") as T) ? (x as T) : default_choice;
}
export function restrict_enum<T extends string>(enum_: {[key: string]: T}, default_choice: T): (x: string | undefined) => T {
    let choices = Object.keys(enum_).map(k => enum_[k]);
    return restrict_choices(choices, default_choice);
}

// Re-export stuff
export {ActionsMixReader, ActionsMixWriter, FrequencyMixReader, FrequencyMixWriter} from "@/classes/Action";
export {BonusesMixReader, BonusesMixWriter} from "@/classes/Bonus";
export {SynergyMixReader, SynergyMixWriter} from "@/classes/Synergy";
export {TagInstanceMixWriter, TagTemplateMixWriter, TagTemplateMixReader, TagInstanceMixReader} from "@/classes/Tag";
export {DeployableMixReader, DeployableMixWriter} from "@/classes/Deployable";
export {DamagesMixReader,DamagesMixWriter } from "@/classes/Damage";
export {RangesMixReader,RangesMixWriter } from "@/classes/Range";
export {CountersMixReader,CountersMixWriter } from "@/classes/Counter";



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