import _ from "lodash";
import type {
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
import { EntryType, RegEntry, Registry, RegRef, RegSer } from '@/new_meta';
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
  "mount": WeaponSize,
  "sp"?: number,
  selected_profile: number;
  integrated: RegRef<any>[];
  profiles: RegMechWeaponProfile[];
}

export interface RegMechWeaponProfile   {
  "type": WeaponType,
  "damage"?: RegDamageData[],
  "range"?: IRangeData[],
  "tags"?: RegTagInstanceData[],
  "description": string, // v-html
  "effect"?: string // v-html
  "on_attack"?: string // v-html
  "on_hit"?: string // v-html
  "on_crit"?: string // v-html
  "actions"?: IActionData[],
  "bonuses"?: IBonusData[]
  "synergies"?: ISynergyData[],
  "deployables"?: RegRef<EntryType.DEPLOYABLE>[],
  "counters"?: RegCounterData[],
}


export class MechWeapon extends RegEntry<EntryType.MECH_WEAPON, RegMechWeaponData>{
   ID!: string
  Name!: string
  Source!: string // must be the same as the Manufacturer ID to sort correctly
  License!: string // reference to the Frame name of the associated license
  LicenseLevel!: number // set to zero for this item to be available to a LL0 character
  Size!:  WeaponSize
  SP!: number
  Profiles!: MechWeaponProfile[]; // For most weapons this will be a single item array
  SelectedProfileIndex!: number;
    Integrated!: RegEntry<any, any>[];



  protected async load(data: RegMechWeaponData): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public async save(): Promise<RegMechWeaponData> {
    let primary_profile = this.Profiles[0];
    return {
      id: this.ID,
      license: this.License,
      integrated: this.Integrated.map(i => i.as_ref()),
      license_level: this.LicenseLevel,
      mount: this.Size,
      name: this.Name,
      profiles: await Promise.all(this.Profiles.map(p => p.save())),
      selected_profile: this.SelectedProfileIndex,
      source: this.Source,
      sp: this.SP,
    }
  }

  get SelectedProfile(): MechWeaponProfile {
    let sel = this.Profiles[this.SelectedProfileIndex] ?? this.Profiles[0];
    return sel;
  }

  static async unpack(dat: PackedMechWeaponData, reg: Registry) {
    // Get the basics
    let integrated: RegEntry<any, any> = reg.();

    let unpacked: RegMechWeaponData = {
      id: dat.id,

    };

    // Get profiles - depends on if array is provided, but we tend towards the default 
    let default_profile: RegMechWeaponProfile = {};

    let profiles: RegMechWeaponProfile[];
    if(dat.profiles && dat.profiles.length) {
      profiles = [];
    } else {
      profiles = [default_profile];
    }

    unpacked.profiles = profiles;
    return reg.get_cat(EntryType.MECH_WEAPON).create(this);
  }


  // Checks whether the given bonus can apply to this weapon
  can_bonus_apply()
}

export class MechWeaponProfile extends RegSer<RegMechWeaponProfile>{
    // Fields. There are a lot - mech equips do be like that
    Name?: string; // Profiles aren't necessarily individually named, though typically they would be???
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
      throw new Error('Method not implemented.');
    }

    public async save(): Promise<RegMechWeaponProfile> {
      return {

            name: this.Name,
            actions: this.Actions.map(a => a.save()),
            bonuses: this.Bonuses.map(b => b.save()),
            synergies: this.Synergies.map(s => s.save()),
            tags: await Promise.all(this.Tags.map(t => t.save())),
            counters: this.Counters.map(c => c.save())


      }
    }
}