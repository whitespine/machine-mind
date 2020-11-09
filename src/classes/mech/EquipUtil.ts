import { MechWeapon } from "@/class";
import { TagInstance } from "../Tag";
import { MechSystem } from "./MechSystem";

export function is_loading(item: MechSystem | MechWeapon): boolean {
    if (item instanceof MechWeapon) {
        return !!item.SelectedProfile.Tags.find(t => t.Tag.IsLoading);
    }
    return false;
}

export function is_ai(item: MechSystem | MechWeapon): boolean {
    let tags: TagInstance[];
    if (item instanceof MechWeapon) {
        tags = item.SelectedProfile.Tags;
    } else {
        tags = item.Tags;
    }
    return !!tags.find(t => t.Tag.IsAI);
}

export function is_smart(item: MechSystem | MechWeapon): boolean {
    if (item instanceof MechWeapon) {
        return !!item.SelectedProfile.Tags.find(t => t.Tag.IsSmart);
    }
    return false;
}

// Returns 0 if not limited
export function limited_max(item: MechSystem | MechWeapon): number {
    let tags: TagInstance[];
    if (item instanceof MechWeapon) {
        tags = item.SelectedProfile.Tags;
    } else {
        tags = item.Tags;
    }
    let limit = tags.find(t => t.Tag.IsLimited);
    return Number.parseInt("" + limit?.Value || "0");
}
