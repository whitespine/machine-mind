import type { MechEquipment, MechWeapon, MechSystem, Registry, EntryType } from "@/class";
import { def, defs, def_empty_map, ident, ident_drop_null, MixBuilder, MixLinks, RWMix} from '@/mixmeta';
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
    SystemTypes: SystemType[] | null;
    WeaponTypes: WeaponType[] | null;
    WeaponSizes: WeaponSize[] | null;
}

export async function CreateSynergy(data: ISynergyData | null, reg_ctx: Registry): Promise<Synergy>{
    let mb = new MixBuilder<Synergy, ISynergyData>({});
    mb.with(new RWMix("Locations", "locations", def<Synergy["Locations"]>([]), ident));
    mb.with(new RWMix("Detail", "detail", defs("Unknown synergy"), ident));
    mb.with(new RWMix("SystemTypes", "system_types", def<Synergy["SystemTypes"]>(null), ident_drop_null));
    mb.with(new RWMix("WeaponTypes", "weapon_types", def<Synergy["WeaponTypes"]>(null), ident_drop_null));
    mb.with(new RWMix("WeaponSizes", "weapon_sizes", def<Synergy["WeaponSizes"]>(null), ident_drop_null));

    return mb.finalize(data, reg_ctx);
}

function allows_weapon(this: Synergy, weapon: MechWeapon): boolean {
    if(this.WeaponSizes?.includes(weapon.Size) === false) {
        return false;
    }
    if(this.WeaponTypes?.includes(weapon.WepType) === false) {
        return false;
    }
    return true;
}

function allows_system(this: Synergy, system: MechSystem): boolean {
    if(this.SystemTypes?.includes(system.SysType) === false) {
        return false;
    }
    return true
}


    // Filters a list of synergies to the given piece of equipment/location
    function MatchSynergies(
        this: Synergy,
        item: MechEquipment,
        active_synergies: Synergy[],
        location: SynergyLocation
    ): Synergy[] {
        // Get type and size of the equip
        let item_type: WeaponType | SystemType;
        let item_size: WeaponSize | null = null;
        if(item.Type === EntryType.MECH_SYSTEM) {
            let sys = item as MechSystem;
            item_type = sys.Type;
        } else if(item.Type === EntryType.MECH_WEAPON) {
            let wep = item as MechWeapon;
            item_type = wep.Type;
            item_size = wep.Size;
        }

        active_synergies = active_synergies.filter(x => x.Locations === "any" || x.locations.includes(location));
        if(item_size) {
            active_synergies = active_synergies.filter(x => x.Sizes === "any" || x.sizes.includes(item_size!));
        }
        active_synergies = active_synergies.filter(x => x.Types === "any" || x.Types.includes(item_type));
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
export const SynergyMixReader = def_empty_map(CreateSynergy);