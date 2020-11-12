import { MechWeapon } from "@src/class";
import { TagInstance } from "../Tag";
import { MechSystem } from "./MechSystem";
import { WeaponMod } from './WeaponMod';

function tags(item: MechSystem | MechWeapon | WeaponMod): TagInstance[] {
    if (item instanceof MechWeapon) {
        return item.SelectedProfile.Tags;
    } else {
        return item.Tags;
    }
}

export function is_loading(item: MechSystem | MechWeapon | WeaponMod): boolean {
    return !!tags(item).find(t => t.Tag.IsLoading);
}

export function is_ai(item:  MechSystem | MechWeapon | WeaponMod): boolean {
    return !!tags(item).find(t => t.Tag.IsAI);
}

export function is_unique(item:  MechSystem | MechWeapon | WeaponMod): boolean {
    return !!tags(item).find(t => t.Tag.IsUnique);
}

export function is_indestructible(item:  MechSystem | MechWeapon | WeaponMod): boolean {
    return !!tags(item).find(t => t.Tag.IsIndestructible );
}



export function is_smart(item: MechWeapon): boolean {
    return !!tags(item).find(t => t.Tag.IsSmart );
}

// Returns 0 if not limited
export function limited_max(item: MechSystem | MechWeapon | WeaponMod): number | null {
    let lim_tag = tags(item).find(t => t.Tag.IsLimited);
    if(!lim_tag) {
        return null;
    }
    return Number.parseInt("" + lim_tag.Value || "0");
}
