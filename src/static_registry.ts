// A trivial implementation of the registry spec

import { nanoid } from "nanoid";
import {
    CoreBonus,
    CoreSystem,
    Environment,
    Faction,
    Frame,
    FrameTrait,
    Manufacturer,
    MechSystem,
    MechWeapon,
    Pilot,
    PilotArmor,
    PilotGear,
    PilotWeapon,
    Quirk,
    Reserve,
    Sitrep,
    Skill,
    Status,
    TagTemplate,
    Talent,
    WeaponMod,
    Mech,
    License,
    Organization,
    Deployable,
    Npc,
    NpcTemplate,
    NpcFeature,
    NpcClass,
} from "@src/class";
import {
    EntryConstructor,
    EntryType,
    InventoriedRegEntry,
    LiveEntryTypes,
    LoadOptions,
    OpCtx,
    RegCat,
    RegEntry,
    RegEntryTypes,
    Registry,
    RegRef,
    ReviveFunc,
} from "@src/registry";
import { RegDeployableData, RegMechData, RegNpcData, RegPilotData } from "@src/interface";
import { defaults } from "@src/funcs";

// This is a shared item between registries that basically just keeps their actors in sync
export class RegEnv {
    // Since actors are global, we use these to track global data
    public pilot_cat: Map<string, RegPilotData> = new Map();
    public mech_cat: Map<string, RegMechData> = new Map();
    public dep_cat: Map<string, RegDeployableData> = new Map();
    public npc_cat: Map<string, RegNpcData> = new Map();

    // Tracks our sub registries. These don't really clean up right now, but maybe someday
    public registries: Map<string, StaticReg> = new Map();
    public registry_inventory_lookup: Map<string, RegRef<EntryType>> = new Map(); // Used by registries to know what registry name corresponds to what InventoriedRegentry
}

// Our static builders
// Simple cat thing. This Takes a few liberties with the type checking but not tooo much

function simple_cat_builder<T extends EntryType>(
    type: T,
    reg: StaticReg,
    clazz: EntryConstructor<T>
): StaticRegCat<T> {
    let template = defaults.DEFAULT_FUNC_FOR(type);
    // Our outer builder, which is used during
    return new StaticRegCat(
        reg,
        type,
        template,
        async (reg, ctx, id, raw, flag, opts) => { // <--- Revive func
            // Our actual revive function shared between all cats.
            // First check for existing item in ctx
            let pre: LiveEntryTypes<T> | undefined = ctx.get(reg.name(), id) as LiveEntryTypes<T>;
            if (!pre) {
                // Otherwise create
                pre = new clazz(type, reg, ctx, id, raw, flag ?? {});

                // Flag with the some junk, doesn't really matter
                pre.Flags = flag ?? {};
            }

            // Wait ready if necessary
            if(opts?.wait_ctx_ready ?? true) {
                // await pre.load_done(); -- unnecessary 
                await pre.ctx_ready();
            }

            // And we're done
            return pre;
        }
    );
}

// We need this to facillitate items with inventories
export class StaticReg extends Registry {
    // Simple lookup for envs. We do NOT self register
    private env: RegEnv;
    private _name: string;
    public readonly flagger: () => any;

    public switch_reg(selector: string): this {
        return (this.env.registries.get(selector) ?? new StaticReg(this.env, selector)) as this;
    }

    public switch_reg_inv(for_inv_item: InventoriedRegEntry<EntryType>): Registry {
        let reg = this.switch_reg(for_inv_item.RegistryID);
        // Also, make sure env can reverse look this up
        this.env.registry_inventory_lookup.set(reg.name(), for_inv_item.as_ref());

        // Finally, return
        return reg;
    }

    public get inventory_for_ref(): RegRef<EntryType> | null {
        return this.env.registry_inventory_lookup.get(this.name()) ?? null;
    }

    public name(): string {
        return this._name;
    }

    // Do this prior to loading things, obviously, or else they will think they belong to another reg
    public set_name(to_name: string) {
        this._name = to_name;
    }

    // Just delegates to std_builders, as we need
    constructor(env: RegEnv, name?: string, flagger?: () => {[key: string]: any}) {
        super();
        this.env = env;
        this._name = name ?? nanoid();
        this.flagger = flagger ?? (() => {});
        this.init_set_cat(simple_cat_builder(EntryType.CORE_BONUS, this, CoreBonus));
        this.init_set_cat(simple_cat_builder(EntryType.ENVIRONMENT, this, Environment));
        this.init_set_cat(simple_cat_builder(EntryType.FACTION, this, Faction));
        this.init_set_cat(simple_cat_builder(EntryType.FRAME, this, Frame));
        this.init_set_cat(simple_cat_builder(EntryType.LICENSE, this, License));
        this.init_set_cat(simple_cat_builder(EntryType.MANUFACTURER, this, Manufacturer));
        this.init_set_cat(simple_cat_builder(EntryType.MECH_SYSTEM, this, MechSystem));
        this.init_set_cat(simple_cat_builder(EntryType.MECH_WEAPON, this, MechWeapon));
        this.init_set_cat(simple_cat_builder(EntryType.NPC_CLASS, this, NpcClass));
        this.init_set_cat(simple_cat_builder(EntryType.NPC_FEATURE, this, NpcFeature));
        this.init_set_cat(simple_cat_builder(EntryType.NPC_TEMPLATE, this, NpcTemplate));
        this.init_set_cat(simple_cat_builder(EntryType.ORGANIZATION, this, Organization));
        this.init_set_cat(simple_cat_builder(EntryType.PILOT_ARMOR, this, PilotArmor));
        this.init_set_cat(simple_cat_builder(EntryType.PILOT_GEAR, this, PilotGear));
        this.init_set_cat(simple_cat_builder(EntryType.PILOT_WEAPON, this, PilotWeapon));
        this.init_set_cat(simple_cat_builder(EntryType.QUIRK, this, Quirk));
        this.init_set_cat(simple_cat_builder(EntryType.RESERVE, this, Reserve));
        this.init_set_cat(simple_cat_builder(EntryType.SITREP, this, Sitrep));
        this.init_set_cat(simple_cat_builder(EntryType.SKILL, this, Skill));
        this.init_set_cat(simple_cat_builder(EntryType.STATUS, this, Status));
        this.init_set_cat(simple_cat_builder(EntryType.TAG, this, TagTemplate));
        this.init_set_cat(simple_cat_builder(EntryType.TALENT, this, Talent));
        this.init_set_cat(simple_cat_builder(EntryType.WEAPON_MOD, this, WeaponMod));
        this.init_set_cat(simple_cat_builder(EntryType.PILOT, this, Pilot));
        this.init_set_cat(simple_cat_builder(EntryType.DEPLOYABLE, this, Deployable));
        this.init_set_cat(simple_cat_builder(EntryType.MECH, this, Mech));
        this.init_set_cat(simple_cat_builder(EntryType.NPC, this, Npc));

        this.init_finalize();

        // Register self
        this.env.registries.set(this._name, this);
    }
}

// This implements the regcat interface with a very simple Map
export class StaticRegCat<T extends EntryType> extends RegCat<T> {
    private reg_data: Map<string, RegEntryTypes<T>> = new Map();
    private template: () => RegEntryTypes<T>;

    constructor(
        parent: Registry,
        cat: T,
        default_template: () => RegEntryTypes<T>,
        creator: ReviveFunc<T>
    ) {
        super(parent, cat, creator);
        this.cat = cat;
        this.template = default_template;
    }

    async lookup_raw(
        criteria: (x: RegEntryTypes<T>) => boolean
    ): Promise<{ id: string; val: RegEntryTypes<T> } | null> {
        for (let [reg_id, reg_raw] of this.reg_data.entries()) {
            if (criteria(reg_raw)) {
                return {
                    id: reg_id,
                    val: reg_raw,
                };
            }
        }
        return null;
    }

    async list_live(ctx: OpCtx, load_options?: LoadOptions): Promise<LiveEntryTypes<T>[]> {
        // We don't really need async, but we would in a normal situation like foundry
        let result: Promise<LiveEntryTypes<T>>[] = [];
        for (let [id, val] of this.reg_data.entries()) {
            result.push(this.revive_func(this.registry, ctx, id, val, (<StaticReg>this.registry).flagger(), load_options));
        }
        return Promise.all(result);
    }

    async create_many_live(ctx: OpCtx, ...vals: RegEntryTypes<T>[]): Promise<LiveEntryTypes<T>[]> {
        let revived: Promise<LiveEntryTypes<T>>[] = [];

        // Set and revive all
        for (let raw of vals) {
            let new_id = nanoid();
            this.reg_data.set(new_id, raw); // It's just that easy!
            let viv = this.revive_func(this.registry, ctx, new_id, raw, (<StaticReg>this.registry).flagger());
            revived.push(viv);
        }

        return Promise.all(revived);
    }

    async create_many_raw(...vals: RegEntryTypes<T>[]): Promise<RegRef<T>[]> {
        let refs: RegRef<T>[] = [];

        // Set and revive all
        for (let raw of vals) {
            let new_id = nanoid();
            this.reg_data.set(new_id, raw); // It's just that easy!
            refs.push({
                id: new_id,
                fallback_lid: (raw as any).lid ?? "", // Our best guess
                type: this.cat,
                reg_name: this.registry.name(),
            });
        }

        return refs;
    }

    // Easy, just retrieve from our map
    async get_raw(id: string): Promise<RegEntryTypes<T> | null> {
        return this.reg_data.get(id) || null;
    }

    // Easy, just copy our map
    async raw_map(): Promise<Map<string, RegEntryTypes<T>>> {
        return new Map(this.reg_data);
    }

    // Easy, just retrieve from map and revive
    async get_live(ctx: OpCtx, id: string, load_options: LoadOptions): Promise<LiveEntryTypes<T> | null> {
        let raw = this.reg_data.get(id);
        if (!raw) {
            return null;
        }
        return this.revive_func(this.registry, ctx, id, raw, (<StaticReg>this.registry).flagger(), load_options);
    }

    // Just a simple .set call. Check if ID exists first
    async update(...items: LiveEntryTypes<T>[]): Promise<void> {
        for (let i of items) {
            if (!this.reg_data.has(i.RegistryID)) {
                console.warn("Tried to update a destroyed/nonexistant/non-owned item");
                continue;
            }
            this.reg_data.set(i.RegistryID, i.save() as RegEntryTypes<T>);
        }
    }

    async delete_id(id: string): Promise<void> {
        this.reg_data.delete(id);
    }

    async create_default(ctx: OpCtx): Promise<LiveEntryTypes<T>> {
        return this.create_live(ctx, this.template());
    }
}
