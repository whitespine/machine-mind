import type { MechEquipment, MechWeapon, MechSystem, Registry, Frame } from "@/class";
import { SimSer, EntryType } from '@/new_meta';
import { WeaponType, WeaponSize, SystemType } from './enums';

export type SynergyLocation = "any" | "active_effects" | "rest" | "weapon" | "system" | "move" | "boost" | "other" | "ram" | "grapple" | "tech_attack" | "overcharge" | "skill_check" | "overwatch" | "improvised_attack" | "disengage" | "stabilize" | "tech" | "lock_on" | "hull" | "agility" | "systems" | "engineering";
export interface ISynergyData {
    locations: SynergyLocation[]; 
    detail: string; // v-html
    system_types?: SystemType[];
    weapon_types?: WeaponType[];
    weapon_sizes?: WeaponSize[];

}

export class Synergy extends SimSer<ISynergyData> {
    Locations!: SynergyLocation[];
    Detail!: string;
    SystemTypes!: SystemType[] | null;
    WeaponTypes!: WeaponType[] | null;
    WeaponSizes!: WeaponSize[] | null;


    allows_weapon(this: Synergy, weapon: MechWeapon): boolean {
        if(this.WeaponSizes?.includes(weapon.Size) === false) {
            return false;
        }
        if(this.WeaponTypes?.includes(weapon.WepType) === false) {
            return false;
        }
        return true;
    }

    allows_system(this: Synergy, system: MechSystem): boolean {
        if(this.SystemTypes?.includes(system.SysType) === false) {
            return false;
        }
        return true
    }


    // Filters a list of synergies to the given piece of equipment/location
    match_synergies(
        item: MechEquipment,
        active_synergies: Synergy[],
        location: SynergyLocation
    ): Synergy[] {
        // Get type and size of the equip
        let item_type: WeaponType | SystemType;
        let item_size: WeaponSize | null = null;
        if(item.EquipType === EntryType.MECH_SYSTEM) {
            let sys = item as MechSystem;
            item_type = sys.EquipType;
        } else if(item.EquipType === EntryType.MECH_WEAPON) {
            let wep = item as MechWeapon;
            item_type = wep.EquipType;
            item_size = wep.Size;
        }

        active_synergies = active_synergies.filter(x => x.Locations === "any" || x.locations.includes(location));
        if(item_size) {
            active_synergies = active_synergies.filter(x => x.Sizes === "any" || x.sizes.includes(item_size!));
        }
        active_synergies = active_synergies.filter(x => x.Types === "any" || x.Types.includes(item_type));
        return active_synergies
    }
    
    
     PilotSynergies(pilot: Pilot): Synergy[] {
        let synergies: Synergy[] = [];
        // Find talents that match up
        for(let pt of pilot.Talents) {
            let i = 0;
            for(let rank of pt.UnlockedRanks) {
                let rank_synergies = rank.synergies || [];
                for (let s of rank_synergies) {
                    synergies.push(s);
                        //title: `${pt.Talent.Name} RANK ${"I".repeat(++i)}//${pt.Talent.Rank(i).name}`,
                }
            }
        }

        return synergies;
    }

     FrameSynergies(frame: Frame, location: string): Synergy[] {
        let synergies: Synergy[] = [];
        for (let t of frame.Traits) {
            for (let s of t.synergies || []) {
                synergies.push({
                    title: t.name,
                    synergy: s,
                });
            }
        }

        synergies = synergies.filter(
            x =>
                !x.synergy.locations ||
                x.synergy.locations.includes(location) ||
                x.synergy.locations.includes("any")
        );

        return synergies;
    }
}
