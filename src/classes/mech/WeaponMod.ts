import { Damage, Range, MechEquipment, Action, Bonus, Synergy, Deployable, Counter } from "@src/class";
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
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { SystemType, WeaponSize, WeaponType } from "../enums";
import { TagInstance } from "../Tag";

export interface AllWeaponModData {
    id: string;
    name: string;
    sp: number;
    source: string; // Manufacturer ID
    license: string; // Frame Name
    license_level: number; // set to 0 to be available to all Pilots
    effect: string; // v-html
    allowed_types?: WeaponType[]; // weapon types the mod CAN be applied to
    allowed_sizes?: WeaponSize[]; // weapon sizes the mod CAN be applied to
    restricted_types?: WeaponType[]; // weapon types the mod CAN NOT be applied to
    restricted_sizes?: WeaponSize[]; // weapon sizes the mod CAN NOT be applied to
    added_range?: IRangeData[]; // damage added to the weapon the mod is installed on, see note
    actions?: IActionData[];
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent weapon
    synergies?: ISynergyData[];
}

export interface PackedWeaponModData extends AllWeaponModData {
    tags: PackedTagInstanceData[]; // tags related to the mod itself
    added_tags?: PackedTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    added_damage?: PackedDamageData[]; // damage added to the weapon the mod is installed on, see note
}

export interface RegWeaponModData
    extends Omit<AllWeaponModData, "restricted_types" | "restricted_sizes"> {
    tags: RegTagInstanceData[]; // tags related to the mod itself
    added_tags: RegTagInstanceData[]; // tags propogated to the weapon the mod is installed on
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    added_damage: RegDamageData[]; // damage added to the weapon the mod is installed on, see note
}

export class WeaponMod extends RegEntry<EntryType.WEAPON_MOD, RegWeaponModData> {
    // General License info
    Source!: string;
    LicenseLevel!: number;
    License!: string;
    ID!: string;
    Name!: string;

    // Mech equipment
    // Uses!: number  -- This doesn't seem to still be supported. Leaving it here just in case
    Destroyed!: boolean;
    Cascading!: boolean;
    Loaded!: boolean;
    // MaxUses!: number
    SP!: number;
    Effect!: string;
    IsIntegrated!: boolean;
    IsUnique!: boolean;
    IsLimited!: boolean;
    IsLoading!: boolean;
    IsAI!: boolean;
    IsIndestructible!: boolean;
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
    Integrated!: RegEntry<any, any>[];

    public async save(): Promise<RegWeaponModData> {
        return {
            license: this.License,
            license_level: this.LicenseLevel,
            id: this.ID,
            source: this.Source,

            name: this.Name,
            sp: this.SP,
            effect: this.Effect,

            added_range: SerUtil.sync_save_all(this.AddedRange),
            added_damage: SerUtil.sync_save_all(this.AddedDamage),
            added_tags: await SerUtil.save_all(this.AddedTags),

            allowed_sizes: this.AllowedSizes,
            allowed_types: this.AllowedTypes,

            ...(await SerUtil.save_commons(this)),
            counters: SerUtil.sync_save_all(this.Counters),
            tags: await SerUtil.save_all(this.Tags),
            integrated: SerUtil.ref_all(this.Integrated),
        };
    }

    public async load(data: RegWeaponModData): Promise<void> {
        this.License = data.license;
        this.LicenseLevel = data.license_level;
        this.ID = data.id;
        this.Source = data.source;

        this.Name = data.name;
        this.SP = data.sp;
        this.Effect = data.effect;

        (this.AddedRange = SerUtil.process_ranges(data.added_range)),
            (this.AddedDamage = SerUtil.process_damages(data.added_damage)),
            (this.AddedTags = await SerUtil.process_tags(this.Registry, data.added_tags)),
            (this.AllowedSizes = data.allowed_sizes ?? []);
        this.AllowedTypes = data.allowed_types ?? [];

        await SerUtil.load_commons(this.Registry, data, this);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Tags = await SerUtil.process_tags(this.Registry, data.tags);
        this.Integrated = await this.Registry.resolve_many_rough(data.integrated);
    }

    public static async unpack(data: PackedWeaponModData, reg: Registry): Promise<WeaponMod> {
        let rdata: RegWeaponModData = {
            ...data,
            added_damage: data.added_damage?.map(Damage.unpack) ?? [],
            added_tags: data.added_tags?.map(TagInstance.unpack_reg) ?? [],

            // Boring stuff
            integrated: SerUtil.unpack_integrated_refs(data.integrated),
            counters: SerUtil.unpack_counters_default(data.counters),
            ...(await SerUtil.unpack_commons_and_tags(data, reg)),
        };
        return reg.get_cat(EntryType.WEAPON_MOD).create(rdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
