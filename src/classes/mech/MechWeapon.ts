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
} from "@/class";
import type {IRangeData, IActionData, IBonusData, ISynergyData, PackedTagInstanceData, RegCounterData, PackedDamageData, PackedDeployableData, PackedCounterData, RegDamageData, RegTagInstanceData } from "@/interface";
import { MountType, RangeType, WeaponSize, WeaponType } from '../enums';
import { EntryType, RegEntry, Registry, RegRef, RegSer, SerUtil } from '@/registry';
import { RegMechData } from './Mech';
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
  "source": string, // must be the same as the Manufacturer ID to sort correctly
  "license": string, // reference to the Frame name of the associated license
  "license_level": number, // set to zero for this item to be available to a LL0 character
  "size": WeaponSize,
  "sp": number,
  selected_profile: number;
  integrated: RegRef<any>[];
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
  "deployables": RegRef<EntryType.DEPLOYABLE>[],
  "counters": RegCounterData[],
}


export class MechWeapon extends RegEntry<EntryType.MECH_WEAPON, RegMechWeaponData>{
  // Generic equip info
   ID!: string
  Name!: string
  Source!: string // must be the same as the Manufacturer ID to sort correctly
  License!: string // reference to the Frame name of the associated license
  LicenseLevel!: number // set to zero for this item to be available to a LL0 character

  // These are common between all profiles
  Size!:  WeaponSize
  SP!: number
  Integrated!: RegEntry<any, any>[];

  // Individual profiles determine our weapon stats
  Profiles!: MechWeaponProfile[]; // For most weapons this will be a single item array
  SelectedProfileIndex!: number;

  // Weapon state
  Loaded!: boolean;
  Destroyed!: boolean;
  Cascading!: boolean; // In case GRAND-UNCLE ever exists

  protected async load(data: RegMechWeaponData): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async save(): Promise<RegMechWeaponData> {
    return {
      id: this.ID,
      license: this.License,
      integrated: this.Integrated.map(i => i.as_ref()),
      license_level: this.LicenseLevel,
      size: this.Size,
      name: this.Name,
      profiles: await SerUtil.save_all(this.Profiles), // await Promise.all(this.Profiles.map(p => p.save())),
      selected_profile: this.SelectedProfileIndex,
      source: this.Source,
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

  static async unpack(dat: PackedMechWeaponData, reg: Registry): Promise<MechWeapon> {
    // Get the basics
    let integrated: RegEntry<any, any> = reg.();

    let unpacked: RegMechWeaponData = {
      id: dat.id,
      cascading: false,
      destroyed: false,
      loaded: true,
      // integrated: dat.in
      license: dat.license,
      license_level: dat.license_level,
      size: dat.mount,
      name: dat.name,
      profiles: [],
      integrated: [],
      selected_profile: 0,
      source: dat.source,
      sp: dat.sp || 0
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
      let dep_entries = await SerUtil.unpack_children(Deployable.unpack, reg, p.deployables);
      let dep_refs = SerUtil.ref_all(dep_entries);
      let tags = await SerUtil.unpack_children(TagInstance.unpack, reg, p.tags);
      let reg_tags = await SerUtil.save_all(tags); // A bit silly, but tags don't actually make entries for us to refer to or whatever, so we need to save them back
      let unpacked_profile: RegMechWeaponProfile = {
        damage: (p.damage || []).map(Damage.unpack),
        range: p.range || [],
        tags: reg_tags,
        effect: p.effect || "",
        on_attack: p.on_attack || "",
        on_crit: p.on_crit || "",
        on_hit: p.on_hit || "",
        actions: p.actions || [],
        bonuses: p.bonuses || [],
        counters: SerUtil.unpack_counters_default(p.counters),
        deployables: dep_refs,
        description: p.description,
        name: p.name,
        synergies: p.synergies || [],
        type: p.type
      }
      unpacked.profiles.push(unpacked_profile);
    }

    // And we are done
    return reg.get_cat(EntryType.MECH_WEAPON).create(unpacked);
  }


  // Checks whether the given bonus can apply to this weapon
  // can_bonus_apply()
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

    Deployables!: Deployable[];
    Counters!: Counter[];
    Tags!: TagInstance[];

    protected async load(data: RegMechWeaponProfile): Promise<void> {
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
      this.Bonuses = SerUtil.process_bonuses(data.bonuses);
      this.Synergies = SerUtil.process_synergies(data.synergies);

      this.Deployables = await this.Registry.resolve_many(data.deployables);
      this.Counters = SerUtil.process_counters(data.counters);
      this.Tags = await SerUtil.process_tags(this.Registry, data.tags);
    }

    public async save(): Promise<RegMechWeaponProfile> {
      return {
            name: this.Name,
            actions: SerUtil.sync_save_all(this.Actions),
            bonuses: SerUtil.sync_save_all(this.Bonuses),
            synergies: SerUtil.sync_save_all(this.Synergies),
            tags: await SerUtil.save_all(this.Tags),
            counters: SerUtil.sync_save_all(this.Counters),
            description: this.Description,
            type: this.WepType,
            damage: SerUtil.sync_save_all(this.BaseDamage),
            deployables: SerUtil.ref_all(this.Deployables),
            effect: this.Effect,
            on_attack: this.OnAttack,
            on_crit: this.OnCrit,
            range: SerUtil.sync_save_all(this.BaseRange),
            on_hit: this.OnHit
      }
    }
}