import _ from "lodash";
import {
    Action,
    Bonus,
    Counter,
    Damage,
    Deployable,
    Range,
    Synergy,
    TagInstance,
    WeaponMod,
} from "@src/class";
import type {IRangeData, IActionData, IBonusData, ISynergyData, PackedTagInstanceData, RegCounterData, PackedDamageData, PackedDeployableData, PackedCounterData, RegDamageData, RegTagInstanceData } from "@src/interface";
import { MountType, RangeType, WeaponSize, WeaponType } from '../enums';
import { EntryType, OpCtx, quick_mm_ref, RegEntry, Registry, RegRef, RegSer, SerUtil } from '@src/registry';
import { RegMechData } from './Mech';
import { defaults, tag_util } from '@src/funcs';
import { Manufacturer } from '../Manufacturer';
// TODO:
// class WeaponAmmo {}

export interface PackedMechWeaponData {
   "id": string,
  "name": string,
  "source": string, // must be the same as the Manufacturer ID to sort correctly
  "license": string, // reference to the Frame name of the associated license
  "license_level": number, // set to zero for this item to be available to a LL0 character
  "mount": WeaponSize,
  "type": WeaponType,
  "damage"?: PackedDamageData[],
  "range"?: IRangeData[],
  "tags"?: PackedTagInstanceData[],
  "sp"?: number,
  "description": string, // v-html
  "effect"?: string // v-html
  "on_attack"?: string // v-html
  "on_hit"?: string // v-html
  "on_crit"?: string // v-html
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[],
  "deployables"?: PackedDeployableData[],
  "counters"?: PackedCounterData[],
  "integrated"?: string[]
  profiles: PackedMechWeaponProfile[];
}
export type PackedMechWeaponProfile  = Omit<PackedMechWeaponData, "profiles" | "source" | "license" | "license_level" | "mount">;

// In our registry version, we push all data down to profiles, to eliminate the confusion of base data vs profile
export interface RegMechWeaponData {
   "id": string,
  "name": string,
  source: RegRef<EntryType.MANUFACTURER> | null,
  "license": string, // reference to the Frame name of the associated license
  "license_level": number, // set to zero for this item to be available to a LL0 character
  "size": WeaponSize,
  "sp": number,
  selected_profile: number;
  integrated: RegRef<any>[];
  "deployables": RegRef<EntryType.DEPLOYABLE>[],
  profiles: RegMechWeaponProfile[];
  

  destroyed: boolean,
  cascading: boolean,
  loaded: boolean
}

export interface RegMechWeaponProfile   {
  "name": string, 
  "type": WeaponType,
  "damage": RegDamageData[],
  "range": IRangeData[],
  "tags": RegTagInstanceData[],
  "description": string, // v-html
  "effect": string // v-html
  "on_attack": string // v-html
  "on_hit": string // v-html
  "on_crit": string // v-html
  "actions": IActionData[],
  "bonuses": IBonusData[]
  "synergies": ISynergyData[],
  "counters": RegCounterData[],
}


export class MechWeapon extends RegEntry<EntryType.MECH_WEAPON>{
  // Generic equip info
   ID!: string
  Name!: string
  Source!: Manufacturer | null; // must be the same as the Manufacturer ID to sort correctly
  License!: string // reference to the Frame name of the associated license
  LicenseLevel!: number // set to zero for this item to be available to a LL0 character

  // These are common between all profiles
  Size!:  WeaponSize
  SP!: number
  Integrated!: RegEntry<any>[];
  Deployables!: Deployable[];

  // Individual profiles determine our weapon stats
  Profiles!: MechWeaponProfile[]; // For most weapons this will be a single item array
  SelectedProfileIndex!: number;

  // Weapon state
  Loaded!: boolean;
  Destroyed!: boolean;
  Cascading!: boolean; // In case GRAND-UNCLE ever exists

  public async load(data: RegMechWeaponData): Promise<void> {
    data = {...defaults.MECH_WEAPON(), ...data};
    this.ID = data.id;
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

    this.SelectedProfileIndex = data.selected_profile;
    // The big one
    this.Profiles = await Promise.all(data.profiles.map(p => new MechWeaponProfile(this.Registry, this.OpCtx,  p).ready()));
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
  get BaseLimit(): number | null{
      return tag_util.limited_max(this);
  }

  public async save(): Promise<RegMechWeaponData> {
    return {
      id: this.ID,
      license: this.License,
      integrated: SerUtil.ref_all(this.Integrated),
      deployables: SerUtil.ref_all(this.Deployables),
      license_level: this.LicenseLevel,
      size: this.Size,
      name: this.Name,
      profiles: await SerUtil.save_all(this.Profiles), // await Promise.all(this.Profiles.map(p => p.save())),
      selected_profile: this.SelectedProfileIndex,
      source: this.Source?.as_ref() || null,
      sp: this.SP,
      loaded: this.Loaded,
      cascading: this.Cascading,
      destroyed: this.Destroyed
    }
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

  static async unpack(dat: PackedMechWeaponData, reg: Registry, ctx: OpCtx): Promise<MechWeapon> {
    // Get the basics
    // These two arrays we continue to add to as we unpack profiles
    let parent_integrated = SerUtil.unpack_integrated_refs(dat.integrated);
    let parent_dep_entries = await SerUtil.unpack_children(Deployable.unpack, reg, ctx, dat.deployables);
    let parent_deployables = SerUtil.ref_all(parent_dep_entries);

    let unpacked: RegMechWeaponData = {
      ...defaults.MECH_WEAPON(),
      ...dat,
      cascading: false,
      destroyed: false,
      loaded: true,
      name: dat.name,
      profiles: [],
      integrated: parent_integrated,
      deployables: parent_deployables,
      selected_profile: 0,
      source: quick_mm_ref(EntryType.MANUFACTURER, dat.source),
    };

    // Get profiles - depends on if array is provided, but we tend towards the default 
    let packed_profiles: PackedMechWeaponProfile[];
    if(dat.profiles && dat.profiles.length) {
      packed_profiles = dat.profiles;
    } else {
      packed_profiles = [dat]; // Treat the item itself as a profile
    }

    // Unpack them
    for(let p of packed_profiles) {
      // Unpack sub components
      // We pluck out deployables and integrated
      let dep_entries = await SerUtil.unpack_children(Deployable.unpack, reg, ctx, p.deployables);
      let dep_refs = SerUtil.ref_all(dep_entries);
      let int_refs = SerUtil.unpack_integrated_refs(p.integrated);
      parent_integrated.push(...int_refs);
      parent_deployables.push(...dep_refs);

      // The rest is left to the profile
      let tags = p.tags?.map(TagInstance.unpack_reg) ?? [];
      let unpacked_profile: RegMechWeaponProfile = {
        damage: (p.damage || []).map(Damage.unpack),
        range: p.range || [],
        tags,
        effect: p.effect || "",
        on_attack: p.on_attack || "",
        on_crit: p.on_crit || "",
        on_hit: p.on_hit || "",
        actions: p.actions || [],
        bonuses: p.bonuses || [],
        counters: SerUtil.unpack_counters_default(p.counters),
        description: p.description,
        name: p.name,
        synergies: p.synergies || [],
        type: p.type
      }
      unpacked.profiles.push(unpacked_profile);
    }

    // And we are done
    return reg.get_cat(EntryType.MECH_WEAPON).create(ctx, unpacked);
  }

    public get_child_entries(): RegEntry<any>[] {
      return [...this.Deployables, ...this.Integrated];
    }
}

export class MechWeaponProfile extends RegSer<RegMechWeaponProfile>{
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
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];

    Counters!: Counter[];
    Tags!: TagInstance[];

    public async load(data: RegMechWeaponProfile): Promise<void> {
      this.Name = data.name;
      this.WepType = data.type;
      this.BaseDamage = SerUtil.process_damages(data.damage);
      this.BaseRange = SerUtil.process_ranges(data.range);
      this.Description = data.description;
      this.Effect = data.effect;
      this.OnAttack = data.on_attack;
      this.OnHit = data.on_hit;
      this.OnCrit = data.on_crit;
      this.Actions = SerUtil.process_actions(data.actions);
      this.Bonuses = SerUtil.process_bonuses(data.bonuses, `Profile: ${this.Name}`);
      this.Synergies = SerUtil.process_synergies(data.synergies);
      this.Counters = SerUtil.process_counters(data.counters);
      this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
    }

    public async save(): Promise<RegMechWeaponProfile> {
      return {
            name: this.Name,
            type: this.WepType,
            description: this.Description,
            effect: this.Effect,
            on_attack: this.OnAttack,
            on_hit: this.OnHit,
            on_crit: this.OnCrit,
            damage: SerUtil.sync_save_all(this.BaseDamage),
            range: SerUtil.sync_save_all(this.BaseRange),
            actions: SerUtil.sync_save_all(this.Actions),
            bonuses: SerUtil.sync_save_all(this.Bonuses),
            synergies: SerUtil.sync_save_all(this.Synergies),
            counters: SerUtil.sync_save_all(this.Counters),
            tags: await SerUtil.save_all(this.Tags),
      }
    }
}