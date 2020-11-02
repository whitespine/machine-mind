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
    Mech,
    MechSystem,
    MechWeapon,
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
} from "@/class";
i;
import {
    CatBuilder,
    CatBuilders,
    EntryType,
    LiveEntryTypes,
    RegCat,
    RegEntry,
    RegEntryTypes,
    Registry,
    ReviveFunc,
} from "@/registry";

// We need this to facillitate items with inventories
export class StaticReg extends Registry {
    // Simple lookup for envs. We do NOT self register
    private env: Map<string, Registry>;

    async get_inventory(for_item_id: string): Promise<Registry | null> {
        return this.env.get(for_item_id) ?? null;
    }

    constructor(env: Map<string, Registry>) {
        super(StaticReg.std_builders());
        this.env = env;
    }

    static std_builders(): CatBuilders {
        // Eventually remove this
        function nodef(v: any) {
            if (!v) {
                throw new Error("No default supported yet");
            }
            return v;
        }

        // Simple cat thing. This doesn't really do much type checking
        function simple_cat<T extends EntryType>(
            type: T,
            clazz: {
                new (_type: T, _reg: Registry, _id: string, _raw: any): any;
            }
        ): CatBuilder<T> {
            return (r: Registry) =>
                new StaticRegCat(r, type, async (_reg, _id, _raw) => (new clazz(type, _reg, _id, nodef(_raw))).ready());
        }

        //export type ReviveFunc<RawType, LiveType> = (reg: Registry, id: string, raw?: RawType) => Promise<LiveType>;
        return {
            // Forgive me for my sins. I couldn't really think of a good way to generify this (as passing classes to construct is yucky
            CoreBonuses: simple_cat(EntryType.CORE_BONUS, CoreBonus),
            CoreSystems: simple_cat(EntryType.CORE_SYSTEM, CoreSystem),
            Environments: simple_cat(EntryType.ENVIRONMENT, Environment),
            Factions: simple_cat(EntryType.FACTION, Faction),
            FrameTraits: simple_cat(EntryType.FRAME_TRAIT, FrameTrait),
            Frames: simple_cat(EntryType.FRAME, Frame),
            Manufacturers: simple_cat(EntryType.MANUFACTURER, Manufacturer),
            MechSystems: simple_cat(EntryType.MECH_SYSTEM, MechSystem),
            MechWeapons: simple_cat(EntryType.MECH_WEAPON, MechWeapon),
            PilotArmor: simple_cat(EntryType.PILOT_ARMOR, PilotArmor),
            PilotGear: simple_cat(EntryType.PILOT_GEAR, PilotGear),
            PilotWeapons: simple_cat(EntryType.PILOT_WEAPON, PilotWeapon),
            Quirks: simple_cat(EntryType.QUIRK, Quirk),
            Reserves: simple_cat(EntryType.RESERVE, Reserve),
            Sitreps: simple_cat(EntryType.SITREP, Sitrep),
            Skills: simple_cat(EntryType.SKILL, Skill),
            Statuses: simple_cat(EntryType.STATUS, Status),
            Tags: simple_cat(EntryType.TAG, TagTemplate),
            Talents: simple_cat(EntryType.TALENT, Talent),
            WeaponMods: simple_cat(EntryType.WEAPON_MOD, WeaponMod),

            // The inventoried things (actors!)
            Pilot: null,
            Deployables: null,
            Mechs: (r) => new StaticRegCat( r, EntryType.MECH, async (_reg, _id, _raw) => new Mech(EntryType.MECH, _reg, _id, nodef(_raw))),

            // to be done
            NpcClasses: null as any,
            NpcFeatures: null as any,
            NpcTemplates: null as any,
        };
    }
}

// This implements the regcat interface with a very simple Map
export class StaticRegCat<T extends EntryType> extends RegCat<T> {
    private reg_data: Map<string, RegEntryTypes[T]> = new Map();

    async lookup_mmid(mmid: string): Promise<LiveEntryTypes[T] | null> {
        // lil' a bit janky, but serviceable
        for (let v of this.reg_data.values()) {
            let va = v as any;
            if (va.id == mmid) {
                return this.revive_func(this.parent, va);
            }
        }
        return null;
    }

    async list_live(): Promise<LiveEntryTypes[T][]> {
        let result: Promise<LiveEntryTypes[T]>[] = [];
        for (let [id, val] of this.reg_data.entries()) {
            result.push(this.revive_func(this.parent, id, val));
        }
        return Promise.all(result);
    }

    async create_many(...vals: RegEntryTypes[T][]): Promise<LiveEntryTypes[T][]> {
        let revived: Promise<LiveEntryTypes[T]>[] = [];

        // Set and revive all
        for (let raw of vals) {
            let new_id = nanoid();
            this.reg_data.set(new_id, raw); // It's just that easy!
            let viv = this.revive_func(this.parent, new_id, raw);
            revived.push(viv);
        }

        return Promise.all(revived);
    }

    // ez
    async get_raw(id: string): Promise<RegEntryTypes[T] | null> {
        return this.reg_data.get(id) || null;
    }

    //ezier
    async list_raw(): Promise<RegEntryTypes[T][]> {
        return Array.from(this.reg_data.values());
    }

    // ezzzz
    async get_live(id: string): Promise<LiveEntryTypes[T] | null> {
        let raw = this.reg_data.get(id);
        if (!raw) {
            return null;
        }
        return this.revive_func(this.parent, id, raw);
    }

    // a bit tricky in terms of what side effects this could have, actually.
    async update(...items: LiveEntryTypes[T][]): Promise<void> {
        for (let i of items) {
            this.reg_data.set(i.RegistryID, i.save());
        }
    }

    async delete_id(id: string): Promise<RegEntryTypes[T] | null> {
        let kept = this.reg_data.get(id);
        this.reg_data.delete(id);
        return kept || null;
    }

    async create_default(): Promise<LiveEntryTypes[T]> {
        let id = nanoid();
        let v = await this.revive_func(this.parent, id);
        this.reg_data.set(id, await v.save());
        return v;
    }
}
