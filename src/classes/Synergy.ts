import { MechEquipment, Pilot, MechWeapon, ItemType, MechSystem, Frame } from "@/class";
import { ident, MixBuilder, MixLinks, RWMix, ser_many } from '@/mixmeta';
import { WeaponType, WeaponSize, SystemType } from './enums';

export type SynergyLocation = "any" | "active_effects" | "rest" | "weapon" | "system" | "move" | "boost" | "other" | "ram" | "grapple" | "tech_attack" | "overcharge" | "skill_check" | "overwatch" | "improvised_attack" | "disengage" | "stabilize" | "tech" | "lock_on" | "hull" | "agility" | "systems" | "engineering";
export interface ISynergyData {
    locations: SynergyLocation[]; 
    detail: string; // v-html
    system_types?: SystemType[];
    weapon_types?: WeaponType[];
    weapon_sizes?: WeaponSize[];

    // Methods: quick check applicability
    allows_weapon(wep: MechWeapon): boolean;
    allows_system(wep: MechSystem): boolean;
}

export interface Synergy extends MixLinks<ISynergyData> {
    Locations: SynergyLocation[];
    Detail: string;
    SystemTypes: SystemType[];
    WeaponTypes: WeaponType[];
    WeaponSizes: WeaponSize[];
}

export function CreateSynergy(data: ISynergyData | null): Synergy{
    let mb = new MixBuilder<Synergy, ISynergyData>({});
    mb.with(new RWMix("Locations", "locations", ["any"], ident, ident));
    mb.with(new RWMix("Detail", "detail", "Synergy effect here.", ident, ident));
    mb.with(new RWMix("SystemTypes", "system_types", [], ident, ident));
    mb.with(new RWMix("WeaponTypes", "weapon_types", [], ident, ident));
    mb.with(new RWMix("WeaponSizes", "weapon_sizes", [], ident, ident));

    return mb.finalize(data);
}

function allows_weapon(this: Synergy, weapon: MechWeapon): boolean {
    return this.WeaponSizes.includes(weapon.Mount

    // Filters a list of synergies to the given piece of equipment/location
    function MatchSynergies(
        item: MechEquipment,
        active_synergies: Synergy[],
        location: SynergyLocation
    ): Synergy[] {
        // Get type and size of the equip
        let item_type: WeaponType | SystemType;
        let item_size: WeaponSize | null = null;
        if(item.ItemType === ItemType.MechSystem) {
            let sys = item as MechSystem;
            item_type = sys.Type;
        } else if(item.ItemType === ItemType.MechWeapon) {
            let wep = item as MechWeapon;
            item_type = wep.Type;
            item_size = wep.Size;
        }

        active_synergies = active_synergies.filter(x => x.locations === "any" || x.locations.includes(location));
        if(item_size) {
            active_synergies = active_synergies.filter(x => x.sizes === "any" || x.sizes.includes(item_size!));
        }
        active_synergies = active_synergies.filter(x => x.types === "any" || x.types.includes(item_type));
        return active_synergies
    }
    
    
    /*
    public static PilotSynergies(pilot: Pilot): Synergy[] {
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

    public static FrameSynergies(frame: Frame, location: string): Synergy[] {
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
    */
}

// Use these for mixin shorthand elsewhere
export const SynergyMixReader = (x: ISynergyData[] | undefined) => (x || []).map(CreateSynergy);
export const SynergyMixWriter = ser_many;