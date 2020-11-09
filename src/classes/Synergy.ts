import { MechEquipment, MechWeapon, MechSystem, Frame } from "@src/class";
import { SimSer, EntryType } from "@src/registry";
import { WeaponType, WeaponSize, SystemType } from "./enums";

export type SynergyLocation =
    | "any"
    | "active_effects"
    | "rest"
    | "weapon"
    | "system"
    | "move"
    | "boost"
    | "other"
    | "ram"
    | "grapple"
    | "tech_attack"
    | "overcharge"
    | "skill_check"
    | "overwatch"
    | "improvised_attack"
    | "disengage"
    | "stabilize"
    | "tech"
    | "lock_on"
    | "hull"
    | "agility"
    | "systems"
    | "engineering";
export interface ISynergyData {
    locations?: SynergyLocation[] | SynergyLocation; // I do not know why the hell you would use any here, but its easier than checking for edge cases, lol
    detail: string; // v-html
    system_types?: Array<SystemType | "any"> | SystemType | "any";
    weapon_types?: Array<WeaponType | "any"> | WeaponType | "any";
    weapon_sizes?: Array<WeaponSize | "any"> | WeaponSize | "any";
}

export class Synergy extends SimSer<ISynergyData> {
    Locations!: SynergyLocation[] | null;
    Detail!: string;
    SystemTypes!: SystemType[] | null;
    WeaponTypes!: WeaponType[] | null;
    WeaponSizes!: WeaponSize[] | null;

    public load(data: ISynergyData): void {
        function resolver<T extends string>(data: T | Array<T | "any"> | "any" | undefined): T[] | null {
            if (!data) {
                return null; // All we need
            } else if (Array.isArray(data)) {
                // pass
            } else {
                data = [data];
            }

            // Handle "any" / empty case
            if (data.length == 0 || data.indexOf("any") != -1) {
                return null;
            }

            // It's normal
            return data as T[];
        }

        this.Locations = resolver(data.locations);
        this.Detail = data.detail;
        this.SystemTypes = resolver(data.system_types);
        this.WeaponTypes = resolver(data.weapon_types);
        this.WeaponSizes = resolver(data.weapon_sizes);
    }
    public save(): ISynergyData {
        return {
            locations: this.Locations ?? ["any"],
            detail: this.Detail,
            system_types: this.SystemTypes ?? ["any"],
            weapon_types: this.WeaponTypes ?? ["any"],
            weapon_sizes: this.WeaponSizes ?? ["any"],
        };
    }

    allows_weapon(weapon: MechWeapon): boolean {
        if (this.WeaponSizes?.includes(weapon.Size) ?? true) {
            if (this.WeaponTypes?.includes(weapon.SelectedProfile.WepType) ?? true) {
                return true;
            }
        }
        return false;
    }

    allows_system(system: MechSystem): boolean {
        return this.SystemTypes?.includes(system.SysType) ?? true;
    }

    // Filters a list of synergies to the given piece of equipment/location
    public static match_synergies(
        item: MechEquipment,
        active_synergies: Synergy[],
        location: SynergyLocation
    ): Synergy[] {
        // Get type and size of the equip
        if (item instanceof MechSystem) {
            active_synergies = active_synergies.filter(x => x.allows_system(item));
        } else if (item instanceof MechWeapon) {
            active_synergies = active_synergies.filter(x => x.allows_weapon(item));
        }

        active_synergies = active_synergies.filter(x => x.Locations?.includes(location) ?? true);
        return active_synergies;
    }
}
