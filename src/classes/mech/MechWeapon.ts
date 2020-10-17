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

// Unpack this item into the given registry, adding any necessary items
export function unpack_weapon(wep: PackedMechWeaponData, reg: Registry ): RegMechWeaponData {
  let {id, sp, source, profiles, name, mount, license_level, license, synergies, integrated, deployables, counters, bonuses, actions, description, tags, type, damage, effect, on_attack, on_crit, on_hit, range  } = wep;
  
  // Make a default profiles
  let default_profile: RegMechWeaponProfile = {
    description,
    type, 
    actions, 
    bonuses,range, counters, damage?.map(d => Damage.unpack(d, reg)), deployables: deployables?.map(d => Deployable.unpack(d, reg)), effect, on_attack, on_crit, on_hit, synergies, tags

  }

  // Pack in the deployables
  let result: RegMechWeaponData = { id, integrated: reg., license, license_level, mount, name, profiles, selected_profile: 0, source, sp

  }

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