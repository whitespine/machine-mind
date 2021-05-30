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
    Manufacturer,
    TagInstance,
} from "@src/class";
import { defaults, limited_max } from "@src/funcs";
import {
    RegActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedRangeData,
    RegRangeData,
    PackedActionData,
    PackedCounterData,
    PackedDamageData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegDamageData,
    RegTagInstanceData,
} from "@src/interface";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { SystemType, WeaponSize, WeaponType } from "@src/enums";
import { merge_defaults } from "../default_entries";
import { WeaponSizeChecklist, WeaponTypeChecklist } from "./MechWeapon";

export interface AllWeaponModData {
    name: string;
    sp: number;
    description: string;
    license: string; // Frame Name
    license_level: number; // set to 0 to be available to all Pilots
    effect: string; // v-html
    synergies?: ISynergyData[];
}

export interface PackedWeaponModData extends AllWeaponModData {
    id: string;
    source: string; // Manufacturer ID
    tags: PackedTagInstanceData[]; // tags related to the mod itself
    added_tags?: PackedTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    bonuses?: PackedBonusData[]; // these bonuses are applied to the pilot, not parent weapon
    actions?: PackedActionData[];
    added_damage?: PackedDamageData[]; // damage added to the weapon the mod is installed on
    added_range?: PackedRangeData[]; // range added to the weapon the mod is installed on
    integrated?: string[];
    restricted_types?: WeaponType[]; // weapon types the mod CAN NOT be applied to
    restricted_sizes?: WeaponSize[]; // weapon sizes the mod CAN NOT be applied to
    allowed_types?: WeaponType[]; // weapon types the mod CAN be applied to
    allowed_sizes?: WeaponSize[]; // weapon sizes the mod CAN be applied to
}

export interface RegWeaponModData extends Required<AllWeaponModData> {
    lid: string;
    source: RegRef<EntryType.MANUFACTURER> | null;
    tags: RegTagInstanceData[]; // tags related to the mod itself
    added_tags: RegTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    added_damage: RegDamageData[]; // damage added to the weapon the mod is installed on
    added_range: RegRangeData[]; // damage added to the weapon the mod is installed on
    bonuses: RegBonusData[]; // these bonuses are applied to the pilot, not parent weapon
    actions: RegActionData[];
    allowed_types: WeaponTypeChecklist; // weapon types the mod CAN be applied to
    allowed_sizes: WeaponSizeChecklist; // weapon sizes the mod CAN be applied to

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
    LID!: string;
    Name!: string;
    Description!: string;

    // Mech equipment
    Uses!: number;
    Destroyed!: boolean; // does this even make sense?
    Cascading!: boolean; // - can mods? Can't hurt I guess
    // BaseLimit!: number
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
    AllowedTypes!: WeaponTypeChecklist; // if empty assume all
    AllowedSizes!: WeaponSizeChecklist; // if empty assume all
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

    // Returns the base max uses
    get BaseLimit(): number | null {
        return limited_max(this);
    }

    public accepts(weapon: MechWeapon): boolean {
        // Use selectedprofile to determine details
        return this.AllowedSizes[weapon.Size] && this.AllowedTypes[weapon.SelectedProfile.WepType];
    }

    protected save_imp(): RegWeaponModData {
        return {
            license: this.License,
            license_level: this.LicenseLevel,
            lid: this.LID,
            source: this.Source?.as_ref() ?? null,

            name: this.Name,
            sp: this.SP,
            effect: this.Effect,
            description: this.Description,

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
        merge_defaults(data, defaults.WEAPON_MOD());
        this.License = data.license;
        this.LicenseLevel = data.license_level;
        this.LID = data.lid;
        this.Source = data.source ? await this.Registry.resolve(this.OpCtx, data.source, {wait_ctx_ready: false}) : null;

        this.Name = data.name;
        this.SP = data.sp;
        this.Effect = data.effect;
        this.Description = data.description;

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

        await SerUtil.load_basd(this.Registry, data, this, this.Name);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {wait_ctx_ready: false});
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

        let rdata: RegWeaponModData = merge_defaults({
            sp: data.sp,
            effect: data.effect,
            lid: data.id,
            name: data.name,
            license: data.license,
            license_level: data.license_level,
            source: quick_local_ref(reg, EntryType.MANUFACTURER, data.source),
            added_damage: data.added_damage?.map(Damage.unpack) ?? [],
            added_range: data.added_range?.map(Range.unpack) ?? [],
            added_tags: SerUtil.unpack_tag_instances(reg, data.added_tags),
            allowed_sizes: MechWeapon.MakeSizeChecklist(allowed_sizes),
            allowed_types: MechWeapon.MakeTypeChecklist(allowed_types),

            // Boring stuff
            integrated: SerUtil.unpack_integrated_refs(reg, data.integrated),
            counters: SerUtil.unpack_counters_default(data.counters),
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
        }, defaults.WEAPON_MOD());
        return reg.get_cat(EntryType.WEAPON_MOD).create_live(ctx, rdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public async emit(): Promise<PackedWeaponModData> {
        return {
            id: this.LID,
            name: this.Name,
            description: this.Description,

            effect: this.Effect,
            license: this.License,
            license_level: this.LicenseLevel,
            sp: this.SP,
        
            added_damage: await SerUtil.emit_all(this.AddedDamage),
            added_range: await SerUtil.emit_all(this.AddedRange),
            added_tags: await SerUtil.emit_all(this.AddedTags),
            allowed_sizes: MechWeapon.FlattenSizeChecklist(this.AllowedSizes),
            allowed_types: MechWeapon.FlattenTypeChecklist(this.AllowedTypes),
            restricted_sizes: [],
            restricted_types: [],

            source: this.Source?.LID ?? "GMS",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            counters: await SerUtil.emit_all(this.Counters),
            deployables: await SerUtil.emit_all(this.Deployables),
            tags: await SerUtil.emit_all(this.Tags),
            synergies: await SerUtil.emit_all(this.Synergies),
            integrated: this.Integrated.map(i => (i as any).LID ?? ""),
        }
    }
}
