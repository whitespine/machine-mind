import {
    Damage,
    Range,
    MechEquipment,
    Action,
    Bonus,
    Synergy,
    Deployable,
    Counter,
    MechWeapon,
} from "@src/class";
import { defaults, tag_util } from "@src/funcs";
import {
    IActionData,
    IBonusData,
    IRangeData,
    ISynergyData,
    PackedCounterData,
    PackedDamageData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegDamageData,
    RegTagInstanceData,
} from "@src/interface";
import { EntryType, OpCtx, quick_mm_ref, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { SystemType, WeaponSize, WeaponType } from "../../enums";
import { Manufacturer } from "../Manufacturer";
import { TagInstance } from "../Tag";

export interface AllWeaponModData {
    id: string;
    name: string;
    sp: number;
    license: string; // Frame Name
    license_level: number; // set to 0 to be available to all Pilots
    effect: string; // v-html
    allowed_types?: WeaponType[]; // weapon types the mod CAN be applied to
    allowed_sizes?: WeaponSize[]; // weapon sizes the mod CAN be applied to
    added_range?: IRangeData[]; // damage added to the weapon the mod is installed on, see note
    actions?: IActionData[];
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent weapon
    synergies?: ISynergyData[];
}

export interface PackedWeaponModData extends AllWeaponModData {
    source: string; // Manufacturer ID
    tags: PackedTagInstanceData[]; // tags related to the mod itself
    added_tags?: PackedTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    added_damage?: PackedDamageData[]; // damage added to the weapon the mod is installed on, see note
    restricted_types?: WeaponType[]; // weapon types the mod CAN NOT be applied to
    restricted_sizes?: WeaponSize[]; // weapon sizes the mod CAN NOT be applied to
}

export interface RegWeaponModData extends Required<AllWeaponModData> {
    source: RegRef<EntryType.MANUFACTURER> | null;
    tags: RegTagInstanceData[]; // tags related to the mod itself
    added_tags: RegTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    added_damage: RegDamageData[]; // damage added to the weapon the mod is installed on, see note

    // state info
    cascading: boolean;
    destroyed: boolean;
    // loaded: boolean;
    uses: number;
}

export class WeaponMod extends RegEntry<EntryType.WEAPON_MOD> {
    // General License info
    Source!: Manufacturer | null;
    LicenseLevel!: number;
    License!: string;
    ID!: string;
    Name!: string;

    // Mech equipment
    Uses!: number;
    Destroyed!: boolean; // does this even make sense?
    Cascading!: boolean; // - can mods? Can't hurt I guess
    // MaxUses!: number
    SP!: number;
    Effect!: string;
    // bIsIntegrated!: boolean; - no
    // IsLoading!: boolean;
    Tags!: TagInstance[];
    // Omit these - can just edit the item, no? May make the return trip slightly more difficult but it is beginning to seem unlikely we'll just be able to do a rev id lookup
    // MaxUseOverride!: number
    // CanSetDamage!: boolean
    // CanSetUses!: boolean

    // Mod specific
    AllowedTypes!: WeaponType[]; // if empty assume all
    AllowedSizes!: WeaponSize[]; // if empty assume all
    // RestrictedTypes!: WeaponType[]  -- These are redundant and thus omitted
    // RestrictedSizes!: WeaponSize[]
    AddedTags!: TagInstance[];
    AddedDamage!: Damage[];
    AddedRange!: Range[];

    // Standard nestables
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any>[];

    // Is this mod an AI?
    get IsAI(): boolean {
        return tag_util.is_ai(this);
    }

    // Is it destructible?
    get IsIndestructible(): boolean {
        return true; // Does this make sense?
    }

    // Is it loading?
    // get IsLoading(): boolean {
    // return tag_util.is_loading(this);
    // }

    // Is it unique?
    get IsUnique(): boolean {
        return tag_util.is_unique(this);
    }

    // Returns the base max uses
    get BaseLimit(): number | null {
        return tag_util.limited_max(this);
    }

    public accepts(weapon: MechWeapon): boolean {
        // (current) size matches?
        if (this.AllowedSizes.length && !this.AllowedSizes.includes(weapon.Size)) {
            return false;
        }

        // (current) type matches?
        if (
            this.AllowedTypes.length &&
            !this.AllowedTypes.includes(weapon.SelectedProfile.WepType)
        ) {
            return false;
        }

        return true;
    }

    public save(): RegWeaponModData {
        return {
            license: this.License,
            license_level: this.LicenseLevel,
            id: this.ID,
            source: this.Source?.as_ref() ?? null,

            name: this.Name,
            sp: this.SP,
            effect: this.Effect,

            cascading: this.Cascading,
            destroyed: this.Destroyed,
            uses: this.Uses,

            added_range: SerUtil.save_all(this.AddedRange),
            added_damage: SerUtil.save_all(this.AddedDamage),
            added_tags: SerUtil.save_all(this.AddedTags),

            allowed_sizes: this.AllowedSizes,
            allowed_types: this.AllowedTypes,

            ...SerUtil.save_commons(this),
            counters: SerUtil.save_all(this.Counters),
            tags: SerUtil.save_all(this.Tags),
            integrated: SerUtil.ref_all(this.Integrated),
        };
    }

    public async load(data: RegWeaponModData): Promise<void> {
        data = { ...defaults.WEAPON_MOD(), ...data };
        this.License = data.license;
        this.LicenseLevel = data.license_level;
        this.ID = data.id;
        this.Source = data.source ? await this.Registry.resolve(this.OpCtx, data.source) : null;

        this.Name = data.name;
        this.SP = data.sp;
        this.Effect = data.effect;

        (this.AddedRange = SerUtil.process_ranges(data.added_range)),
            (this.AddedDamage = SerUtil.process_damages(data.added_damage)),
            (this.AddedTags = await SerUtil.process_tags(
                this.Registry,
                this.OpCtx,
                data.added_tags
            )),
            (this.AllowedSizes = data.allowed_sizes ?? []);
        this.AllowedTypes = data.allowed_types ?? [];

        this.Cascading = data.cascading;
        this.Destroyed = data.destroyed;
        this.Cascading = data.cascading;
        this.Uses = data.uses;

        await SerUtil.load_basd(this.Registry, data, this);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Integrated = await this.Registry.resolve_many_rough(this.OpCtx, data.integrated);
    }

    public static async unpack(
        data: PackedWeaponModData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<WeaponMod> {
        // Figure allowed sizes / types
        let allowed_sizes = [
            WeaponSize.Aux,
            WeaponSize.Main,
            WeaponSize.Heavy,
            WeaponSize.Superheavy,
        ];
        let allowed_types = [
            WeaponType.CQB,
            WeaponType.Cannon,
            WeaponType.Launcher,
            WeaponType.Melee,
            WeaponType.Nexus,
            WeaponType.Rifle,
        ];

        // Cull to the not restricted and allowed
        if (data.restricted_types) {
            allowed_types = allowed_types.filter(x => !data.restricted_types?.includes(x));
        }
        if (data.allowed_types && data.allowed_types.length) {
            allowed_types = allowed_types.filter(x => data.allowed_types?.includes(x));
        }
        if (data.restricted_sizes) {
            allowed_sizes = allowed_sizes.filter(x => !data.restricted_sizes?.includes(x));
        }
        if (data.allowed_sizes && data.allowed_sizes.length) {
            allowed_sizes = allowed_sizes.filter(x => data.allowed_sizes?.includes(x));
        }

        let rdata: RegWeaponModData = {
            ...defaults.WEAPON_MOD(),
            ...data,
            source: quick_mm_ref(EntryType.MANUFACTURER, data.source),
            added_damage: data.added_damage?.map(Damage.unpack) ?? [],
            added_tags: data.added_tags?.map(TagInstance.unpack_reg) ?? [],
            allowed_sizes,
            allowed_types,

            // Boring stuff
            integrated: SerUtil.unpack_integrated_refs(data.integrated),
            counters: SerUtil.unpack_counters_default(data.counters),
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
        };
        return reg.get_cat(EntryType.WEAPON_MOD).create_live(ctx, rdata, true);
    }

    public get_child_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
