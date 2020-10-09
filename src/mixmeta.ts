import { keys } from 'ts-transformer-keys';
import {ID_ANONYMOUS, Registry, VRegistryItem } from './classes/registry';

// Handles a single property in a single item, specifically one that saves/stores from a single
export class RWMix<Host, HostKey extends keyof Host, Src extends object, SrcName extends keyof Src> {
    // What key we expose in the actual class
    public prop_key: HostKey;

    // What we key save/load from in raw json data
    public src_key: SrcName;

    // Our current held data
    public val!: Host[HostKey];

    // Our fallback if we can't read
    // public default_val: Host[HostKey];

    // Flag demarcates if we were able to legitimately load data, or if we just used the default due to undefined
    private defined: boolean = false;

    // Hooks. Apply in order.
    private pre_setters: Array<(nv:Host[HostKey]) => Host[HostKey]> = []; // Can override the data that is passed in. If an error is thrown, the write is dropped
    private post_setters: Array<() => any> = []; // Called post set. Should be careful about setting mixlets from here so as to not cause errors

    // Writes data to compendium/saves etc like so
    public writer: (x: Host[HostKey]) => Promise<Src[SrcName]>;

    // Reads data from compendium pack/saves like so. Uses default if value not present/null
    public reader: (x: Src[SrcName] | undefined, reg_ctx: Registry) => Promise<Host[HostKey]>;

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
    public constructor(prop_key: HostKey, src_key: SrcName, reader: (x: Src[SrcName] | undefined, reg_ctx: Registry) => Promise<Host[HostKey]>, writer: (x: Host[HostKey]) => Promise<Src[SrcName]>) {
        this.prop_key = prop_key;
        this.src_key = src_key;
        // this.val = default_val;
        // this.default_val = default_val;
        this.reader = reader;
        this.writer = writer; 
    }

    // Loads this mixlet from the specified raw data
    public async load(from: Partial<Src>, ctx: Registry) {
        let raw: Src[SrcName] | undefined = from[this.src_key];
        this.val = await this.reader(raw, ctx);

        // Was it defined? We only write back out if it was. Maybe change this behavior later to get better "default" performance
        this.defined = raw !== undefined;
    }

    // Writes this mixlet to the specified raw data
    public async save(to: Src) {
        if(this.defined) {
            to[this.src_key] = await this.writer(this.val);
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
    Deserialize(x: Partial<SrcType>, reg_ctx: Registry): Promise<this>;
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
    target.Deserialize = async (x: Partial<SrcType>, reg_ctx: Registry) => {
        for(let m of target._mix_list) {
            await m.load(x, reg_ctx);
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
    async finalize(data: SrcType | null, reg_ctx: Registry): Promise<HostType> {
        // Copy the array just to remove any potential lingering "this" connotations. Hopefully js garbage collection is smart enough to ignore it, but proxies are weird
        let mix_list = [...this.mix_list];

        // Create the concrete
        pour_mixlets(this.host, mix_list);

        // Create our proxy
        let rv = new Proxy(this.host as HostType, proxy_handler);

        // Deserialize. This also handles defaults
        await rv.Deserialize(data || {}, reg_ctx); 

        // Set the registry info. Registry will override as necessary on retreival
        data.

            
        // Validate
        validate_props<HostType>(rv);

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
// Just write what you read
export async function ident<T>(t: T): Promise<T> { return t; }

// Write what you read, but if its undefined then get ANGY
export async function ident_strict<T>(t: T | undefined): Promise<T> { 
    if(t === undefined) {
        throw new Error("Error: undefined mandatory field");
    }
    return t; 
}

// Write what you read, substitute if undefined
export function def<T>(default_val: T): (x: T | undefined) => Promise<T> { 
    return async (x: T | undefined) => {
        if(x === undefined) {
            return default_val;
        } else {
            return x;
        }
    }
}
// Some helpers to handle specific types
type def_typed<T> =(default_val: T) => ((x: T | undefined) => Promise<T>);
export const defs: def_typed<string> = def;
export const defn: def_typed<number> = def;
export const defb: def_typed<boolean> = def;
export const defn_null: def_typed<number | null> = def;
export const defs_null: def_typed<string | null> = def;

// Use this to handle ID defaults
/*
export async function def_anon(v: string | undefined): Promise<string | typeof ID_ANONYMOUS> {
    return v || ID_ANONYMOUS    
}
export async function ident_drop_anon(v: string | typeof ID_ANONYMOUS): Promise<string | undefined> {
    if(v == ID_ANONYMOUS) {
        return undefined;
    }
    return v;
}
export async function ident_drop_anon_strict(v: string | typeof ID_ANONYMOUS): Promise<string> {
    if(typeof v != "string") {
        throw new Error("Error: Tried to commit when ID was left anonymous");
    }
    return v;
}
*/

// Write what you read, lazy sub on default. Callback doesn't need to use registry
export type RegFetcher<T> = (reg: Registry) => Promise<T>;
export function def_lazy<T>(default_val: RegFetcher<T>): (x: T | undefined, reg_ctx: Registry) => Promise<T> {
    return async (x: T | undefined, reg_ctx: Registry) => {
        if(x === undefined) {
            return default_val(reg_ctx);
        } else {
            return x;
        }
    }
}

// Some shorthands


// Return input, except map null to undefined
export async function ident_drop_null<T>(t: T): Promise<NonNullable<T> | undefined> { 
    return t ?? undefined;
}

// Serialize the provided item using its own serialization function
export async function ser_one<T extends {Serialize(): G}, G>(t: T): Promise<G> {
    return t.Serialize();
}

// Serialize an array
export async function ser_many<T extends {Serialize(): G}, G>(t: T[]): Promise<G[]> {
    return t.map(v => v.Serialize());
}

// Wraps a function such that it defaults its param to an empty array. Does not assume that our output will be an array, but definitely supports that
export function def_empty<I, O>(func: (vals: Array<I>, ctx: Registry) => O): (vals: Array<I> | undefined, ctx: Registry) => Promise<O> {
    return async (v: Array<I> | undefined, ctx: Registry) => func(v || [], ctx);
}

// Wraps a function such that it maps over an array, defaulting to an empty array if none is given
export function def_empty_map<I, O>(func: (val: I, ctx: Registry) => Promise<O>): (vals: Array<I> | undefined, ctx: Registry) => Promise<O[]> {
    return (v: Array<I> | undefined, ctx: Registry) => Promise.all((v || []).map(v => func(v, ctx)));
}

// Easily lock into enums using restrict_enum
export function restrict_choices<T extends string>(choices: T[], default_choice: T): (x: string | undefined) => Promise<T> {
    return async (x: string | undefined) => choices.includes((x || "") as T) ? (x as T) : default_choice;
}
export function restrict_enum<T extends string>(enum_: {[key: string]: T}, default_choice: T): (x: string | undefined) => Promise<T> {
    let choices = Object.keys(enum_).map(k => enum_[k]);
    return restrict_choices(choices, default_choice);
}

// Pull stuff from the register
export async function IntegratedMixReader(integrated_keys: string[] | undefined, ctx: Registry): Promise<VRegistryItem[]> {
    integrated_keys ||= [];
    let found: VRegistryItem[] = [];
    for(let k of integrated_keys) {
        let v = await ctx.get_from_anywhere(k);
        if(v) {
            found.push(v);
        } else {
            console.warn(`Unable to find integrated item ${k}`);
        }
    }
    return found;
}
export async function IntegratedMixWriter(items: VRegistryItem[]): Promise<string[]> {
    let result: string[] = [];
    for(let i of items) {
        let k = i.RegistryID;
        if(typeof k != "string") {
            throw new Error("Oof - somehow an integrated item couldn't be found in the registry, in spite of being stored to the item. weird");
        }
        result.push(k);
    }
    return result;
}

// Re-export stuff
export {ActionsMixReader, FrequencyMixReader, FrequencyMixWriter} from "@/classes/Action";
export {BonusesMixReader, } from "@/classes/Bonus";
export {SynergyMixReader, } from "@/classes/Synergy";
export {TagTemplateMixReader, TagInstanceMixReader} from "@/classes/Tag";
export {DeployableMixReader, } from "@/classes/Deployable";
export {DamagesMixReader, } from "@/classes/Damage";
export {RangesMixReader, } from "@/classes/Range";
export {CountersMixReader, } from "@/classes/Counter";

