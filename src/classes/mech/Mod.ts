import { WeaponType, WeaponSize, MountType, SystemType } from "@/class";
import { ITagData, IDamageData, IActionData, IRangeData, IBonusData, ISynergyData, IDeployableData, ICounterData, } from '@/interface';
import { IIntegrated, IModifies } from '../CompendiumItem';

export interface IWeaponModData extends IIntegrated, IDeploys, ICounted, IModifies {
  id: string,
  name: string,
  sp: number,
  allowed_types?: WeaponType[] | null, // weapon types the mod CAN be applied to
  allowed_sizes?: WeaponSize[] | null, // weapon sizes the mod CAN be applied to
  allowed_mounts?: MountType[] | null, // weapon mount types the mod CAN be applied to
  restricted_types?: WeaponType[] | null, // weapon types the mod CAN NOT be applied to
  restricted_sizes?: WeaponSize[] | null, // weapon sizes the mod CAN NOT be applied to
  restricted_mounts?: MountType[] | null, // weapon mount types the mod CAN NOT be applied to
  source: string, // Manufacturer ID
  license: string, // Frame Name
  license_level: number, // set to 0 to be available to all Pilots
  effect: string, // v-html
  added_tags: ITagData[] // tags propogated to the weapon the mod is installed on
  added_damage: IDamageData[] // damage added to the weapon the mod is installed on, see note
  added_range: IRangeData[] // damage added to the weapon the mod is installed on, see note
  // bonuses?: IBonusData[] | null, // these bonuses are applied to the pilot, not parent weapon
  // tags: ITagData[], // tags related to the mod itself
}


export interface ISystemModData {
  id: string,
  name: string,
  sp: number,
  allowed_types?: SystemType[] | null, // system types the mod CAN be applied to
  restricted_types?: SystemType[] | null, // system types the mod CAN NOT be applied to
  source: string, // Manufacturer ID
  license: string, // Frame Name
  license_level: number, // set to 0 to be available to all Pilots
  effect: string, // v-html
  tags: ITagInstanceData[], // tags related to the mod itself
  added_tags: ITagInstanceData[] // tags propogated to the system the mod is installed on
  actions?: IActionData[] | null,
  bonuses?: IBonusData[] | null, // these bonuses are applied to the pilot, not parent system
  synergies?: ISynergyData[] | null,
  deployables?: IDeployableData[] | null,
  counters?: ICounterData[] | null,
  integrated?: string[]
}