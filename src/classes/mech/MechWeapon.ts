import {
    Action,
    Bonus,
    Counter,
    Damage,
    Deployable,
    Manufacturer,
    Range,
    Synergy,
    TagInstance,
    WeaponMod,
} from "@src/class";
import type {PackedRangeData, RegRangeData, ISynergyData, PackedTagInstanceData, RegCounterData, PackedDamageData, PackedDeployableData, PackedCounterData, RegDamageData, RegTagInstanceData, PackedBonusData, RegBonusData, PackedActionData, RegActionData } from "@src/interface";
import { WeaponSize, WeaponType } from "@src/enums";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
} from "@src/registry";
import { defaults, tag_util } from "@src/funcs";
import { merge_defaults } from "../default_entries";
// TODO:
// class WeaponAmmo {}

export interface PackedMechWeaponData {
    id: string;
    name: string;
    source: string; // must be the same as the Manufacturer ID to sort correctly
    license: string; // reference to the Frame name of the associated license
    license_level: number; // set to zero for this item to be available to a LL0 character
    mount: WeaponSize;
    type: WeaponType;
    damage?: PackedDamageData[];
    range?: PackedRangeData[];
    tags?: PackedTagInstanceData[];
    sp?: number;
    description: string; // v-html
    effect?: string; // v-html
    on_attack?: string; // v-html
    on_hit?: string; // v-html
    on_crit?: string; // v-html
    actions?: PackedActionData[];
    bonuses?: PackedBonusData[];
    synergies?: ISynergyData[];
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    cost?: number; // How many limited uses to consume per firing?
    skirmish?: boolean; // Can we fire this weapon as part of a skirmish? Default true
    barrage?: boolean; // Can we fire this weapon as part of a barrage? Default true
    profiles: PackedMechWeaponProfile[];

    // Some weapons don't like nice things
    no_attack?: boolean;
    no_bonus?: boolean;
    no_synergy?: boolean;
    no_mods?: boolean;
    no_core_bonus?: boolean;
}
export type PackedMechWeaponProfile = Omit<
    PackedMechWeaponData,
    "profiles" | "source" | "license" | "license_level" | "mount"
>;

// In our registry version, we push all data down to profiles, to eliminate the confusion of base data vs profile
export interface RegMechWeaponData {
    lid: string;
    name: string;
    source: RegRef<EntryType.MANUFACTURER> | null;
    license: string; // reference to the Frame name of the associated license
    license_level: number; // set to zero for this item to be available to a LL0 character
    size: WeaponSize;
    sp: number;
    selected_profile: number;
    integrated: RegRef<any>[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    uses: number;
    profiles: RegMechWeaponProfile[];

    // Does this weapon HATE FUN? Pegasus autogun/mimic gun are good examples
    no_core_bonuses: boolean;
    no_mods: boolean;
    no_bonuses: boolean;
    no_synergies: boolean;
    no_attack: boolean; // See: Autopod, vorpal, etc

    destroyed: boolean;
    cascading: boolean;
    loaded: boolean;
}

// Used to store things like what damage types a bonus affects
export type WeaponTypeChecklist = { [key in WeaponType]: boolean };
export type WeaponSizeChecklist = { [key in WeaponSize]: boolean };

export interface RegMechWeaponProfile {
    name: string;
    type: WeaponType;
    damage: RegDamageData[];
    range: RegRangeData[];
    tags: RegTagInstanceData[];
    description: string; // v-html
    effect: string; // v-html
    on_attack: string; // v-html
    on_hit: string; // v-html
    on_crit: string; // v-html

    // How many limited uses it consumes
    cost: number;

    // When can we use this profile
    skirmishable: boolean;
    barrageable: boolean;

    // basc
    actions: RegActionData[];
    bonuses: RegBonusData[];
    synergies: ISynergyData[];
    counters: RegCounterData[];
}

export class MechWeapon extends RegEntry<EntryType.MECH_WEAPON> {
    // Generic equip info
    LID!: string;
    Name!: string;
    Source!: Manufacturer | null; // must be the same as the Manufacturer ID to sort correctly
    License!: string; // reference to the Frame name of the associated license
    LicenseLevel!: number; // set to zero for this item to be available to a LL0 character

    // These are common between all profiles
    Size!: WeaponSize;
    SP!: number;
    Integrated!: RegEntry<any>[];
    Deployables!: Deployable[];

    // Individual profiles determine our weapon stats
    Profiles!: MechWeaponProfile[]; // For most weapons this will be a single item array
    SelectedProfileIndex!: number;

    // Weapon state
    Loaded!: boolean;
    Destroyed!: boolean;
    Cascading!: boolean; // In case GRAND-UNCLE ever exists
    Uses!: number;

    // What can this weapon NOT do. TODO - make the "NoBonuses" one do something
    NoAttack!: boolean; // This weapon doesn't conventionally attack
    NoBonuses!: boolean; // Cannot benefit from any bonuses, generally
    NoCoreBonuses!: boolean; // Cannot benefit from core bonuses. Dunno when this wouldn't be covered by Bonuses but w/e
    NoMods!: boolean; // No mods allowed
    NoSynergies!: boolean; // We should not collect/display synergies when using/displaying this weapon

    public async load(data: RegMechWeaponData): Promise<void> {
        merge_defaults(data, defaults.MECH_WEAPON());
        this.LID = data.lid;
        this.Name = data.name;
        this.Source = data.source ? await this.Registry.resolve(this.OpCtx, data.source) : null;
        this.License = data.license;
        this.LicenseLevel = data.license_level;

        this.Size = data.size;
        this.SP = data.sp;
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated);
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables);

        this.Loaded = data.loaded;
        this.Destroyed = data.destroyed;
        this.Cascading = data.cascading;
        this.Uses = data.uses;

        this.NoAttack = data.no_attack;
        this.NoBonuses = data.no_bonuses;
        this.NoCoreBonuses = data.no_core_bonuses;
        this.NoMods = data.no_mods;
        this.NoSynergies = data.no_synergies;

        this.SelectedProfileIndex = data.selected_profile;
        // The big one
        this.Profiles = await Promise.all(
            data.profiles.map(p => new MechWeaponProfile(this.Registry, this.OpCtx, p).ready())
        );
    }

    // Is this mod an AI?
    get IsAI(): boolean {
        return tag_util.is_ai(this);
    }

    // Is it destructible?
    get IsIndestructible(): boolean {
        return true; // Does this make sense?
    }

    // Is it loading?
    get IsLoading(): boolean {
        return tag_util.is_loading(this);
    }

    // Is it unique?
    get IsUnique(): boolean {
        return tag_util.is_unique(this);
    }

    // Returns the base max uses
    get BaseLimit(): number | null {
        return tag_util.limited_max(this);
    }

    protected save_imp(): RegMechWeaponData {
        return {
            lid: this.LID,
            license: this.License,
            integrated: SerUtil.ref_all(this.Integrated),
            deployables: SerUtil.ref_all(this.Deployables),
            license_level: this.LicenseLevel,
            size: this.Size,
            name: this.Name,
            profiles: SerUtil.save_all(this.Profiles),
            selected_profile: this.SelectedProfileIndex,
            source: this.Source?.as_ref() || null,
            sp: this.SP,
            loaded: this.Loaded,
            cascading: this.Cascading,
            destroyed: this.Destroyed,
            uses: this.Uses,
            no_attack: this.NoAttack,
            no_bonuses: this.NoBonuses,
            no_core_bonuses: this.NoCoreBonuses,
            no_mods: this.NoMods,
            no_synergies: this.NoSynergies
        };
    }

    get SelectedProfile(): MechWeaponProfile {
        let sel = this.Profiles[this.SelectedProfileIndex] ?? this.Profiles[0];
        return sel;
    }

    // Wrappers to conveniently get active bonuses/actions/whatever
    get Bonuses(): Bonus[] {
        return this.SelectedProfile.Bonuses;
    }

    get Actions(): Action[] {
        return this.SelectedProfile.Actions;
    }

    get Synergies(): Synergy[] {
        return this.SelectedProfile.Synergies;
    }

    static async unpack(data: PackedMechWeaponData, reg: Registry, ctx: OpCtx): Promise<MechWeapon> {
        // Get the basics
        // These two arrays we continue to add to as we unpack profiles
        let parent_integrated = SerUtil.unpack_integrated_refs(reg, data.integrated);
        let parent_dep_entries = await Promise.all((data.deployables ?? []).map(i => Deployable.unpack(i, reg, ctx, data.id)));
        let parent_deployables = SerUtil.ref_all(parent_dep_entries);

        let unpacked: RegMechWeaponData = merge_defaults({
            lid: data.id,
            cascading: false,
            destroyed: false,
            loaded: true,
            name: data.name,
            license: data.license,
            license_level: data.license_level,
            no_attack: data.no_attack,
            no_bonuses: data.no_bonus,
            no_core_bonuses: data.no_core_bonus,
            no_mods: data.no_mods,
            no_synergies: data.no_synergy,
            sp: data.sp,
            profiles: [],
            integrated: parent_integrated,
            deployables: parent_deployables,
            selected_profile: 0,
            source: quick_local_ref(reg, EntryType.MANUFACTURER, data.source),
            size: SerUtil.restrict_enum(WeaponSize, WeaponSize.Main, data.mount)
        }, defaults.MECH_WEAPON());

        // Get profiles - depends on if array is provided, but we tend towards the default
        let packed_profiles: PackedMechWeaponProfile[];
        if (data.profiles && data.profiles.length) {
            packed_profiles = data.profiles;
        } else {
            packed_profiles = [data]; // Treat the item itself as a profile
        }

        // Unpack them
        for (let p of packed_profiles) {
            // Unpack sub components
            // We pluck out deployables and integrated
            let dep_entries = await Promise.all((p.deployables ?? []).map(i => Deployable.unpack(i, reg, ctx, `${data.id}_${p.name}`)));
            let dep_refs = SerUtil.ref_all(dep_entries);
            let int_refs = SerUtil.unpack_integrated_refs(reg, p.integrated);
            parent_integrated.push(...int_refs);
            parent_deployables.push(...dep_refs);

            // Barrageable have a weird interaction.
            let barrageable: boolean;
            let skirmishable: boolean;
            if(p.barrage == undefined && p.skirmish == undefined) {
                // Neither set. Go with defaults
                barrageable = true;
                skirmishable = unpacked.size != WeaponSize.Superheavy;
            } else if(p.barrage == undefined) {
                // Only skirmish set. We assume barrage to be false, in this case. (should we? the data spec is unclear)
                skirmishable = p.skirmish!;
                barrageable = false;
            } else if(p.skirmish == undefined) {
                // Only barrage set. We assume skirmish to be false, in this case.
                skirmishable = false;
                barrageable = p.barrage!;
            } else {
                skirmishable = p.skirmish!;
                barrageable = p.barrage!;
            }

            // The rest is left to the profile
            let tags = SerUtil.unpack_tag_instances(reg, p.tags);
            let unpacked_profile: RegMechWeaponProfile = {
                damage: (p.damage || []).map(Damage.unpack),
                range: (p.range || []).map(Range.unpack),
                tags,
                effect: p.effect || "",
                on_attack: p.on_attack || "",
                on_crit: p.on_crit || "",
                on_hit: p.on_hit || "",
                cost: p.cost ?? 1,
                barrageable,
                skirmishable,
                actions: (p.actions ?? []).map(Action.unpack),
                bonuses: (p.bonuses ?? []).map(Bonus.unpack),
                counters: SerUtil.unpack_counters_default(p.counters),
                description: p.description,
                name: p.name,
                synergies: p.synergies || [],
                type: p.type,
            };
            unpacked.profiles.push(unpacked_profile);
        }

        // And we are done
        return reg.get_cat(EntryType.MECH_WEAPON).create_live(ctx, unpacked);
    }

    // Weapons need to bring their stuff along too!
    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public static MakeTypeChecklist(types: WeaponType[]): WeaponTypeChecklist {
        let override = types.length == 0;
        return {
            CQB: override || types.includes(WeaponType.CQB),
            Cannon: override || types.includes(WeaponType.Cannon),
            Launcher: override || types.includes(WeaponType.Launcher),
            Melee: override || types.includes(WeaponType.Melee),
            Nexus: override || types.includes(WeaponType.Nexus),
            Rifle: override || types.includes(WeaponType.Rifle),
        };
    }

    public static MakeSizeChecklist(types: WeaponSize[]): WeaponSizeChecklist {
        let override = types.length == 0;
        return {
            Auxiliary: override || types.includes(WeaponSize.Aux),
            Heavy: override || types.includes(WeaponSize.Heavy),
            Main: override || types.includes(WeaponSize.Main),
            Superheavy: override || types.includes(WeaponSize.Superheavy),
        };
    }
}

// A subcomponent of a weapon - essentially the part that describes how it actually fires
// We coerce all weapons to use these, even if they only have one firing mode, for the sake of consistency
export class MechWeaponProfile extends RegSer<RegMechWeaponProfile> {
    // Fields. There are a lot - mech equips do be like that
    Name!: string; // Profiles aren't necessarily individually named, though typically they would be. Auto assign ""
    WepType!: WeaponType;
    BaseDamage!: Damage[];
    BaseRange!: Range[];
    Description!: string;
    Effect!: string;
    OnAttack!: string;
    OnHit!: string;
    OnCrit!: string;
    Barrageable!: boolean; // If set and skirmishable isn't we assume this takes the entire barrage action
    Skirmishable!: boolean; // This will be true for most non-superheavies. Some weapons, however, cannot be skirmished (see vorpal blade). This is different from "no_attack" (see autopod), which more means auto-hit
    Cost!: number; // How much does shooting this bad-boi cost
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];

    Counters!: Counter[];
    Tags!: TagInstance[];

    public async load(data: RegMechWeaponProfile): Promise<void> {
        merge_defaults(data, defaults.WEAPON_PROFILE());
        this.Name = data.name;
        this.WepType = data.type;
        this.BaseDamage = SerUtil.process_damages(data.damage);
        this.BaseRange = SerUtil.process_ranges(data.range);
        this.Description = data.description;
        this.Effect = data.effect;
        this.OnAttack = data.on_attack;
        this.OnHit = data.on_hit;
        this.OnCrit = data.on_crit;
        this.Cost = data.cost;
        this.Barrageable = data.barrageable;
        this.Skirmishable = data.skirmishable;
        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses, `Profile: ${this.Name}`);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
    }

    protected save_imp(): RegMechWeaponProfile {
        return {
            name: this.Name,
            type: this.WepType,
            description: this.Description,
            effect: this.Effect,
            on_attack: this.OnAttack,
            on_hit: this.OnHit,
            on_crit: this.OnCrit,
            cost: this.Cost,
            barrageable: this.Barrageable,
            skirmishable: this.Skirmishable,
            damage: SerUtil.save_all(this.BaseDamage),
            range: SerUtil.save_all(this.BaseRange),
            actions: SerUtil.save_all(this.Actions),
            bonuses: SerUtil.save_all(this.Bonuses),
            synergies: SerUtil.save_all(this.Synergies),
            counters: SerUtil.save_all(this.Counters),
            tags: SerUtil.save_all(this.Tags),
        };
    }
}
