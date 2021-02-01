import { MechWeapon, TagInstance  } from "@src/class";

// Returns all tags on a mech equippable
// Mech weapons returns across all profiles. 
// If you want more specific, provide a profile instead
type TaggedEquippable = MechWeapon | {Tags: TagInstance[]};
function tags(item: TaggedEquippable): TagInstance[] {
    if (item instanceof MechWeapon) {
        return item.Profiles.flatMap(p => p.Tags);
    } else {
        return item.Tags;
    }
}

export function is_loading(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsLoading);
}

export function is_ai(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsAI);
}

export function is_unique(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsUnique);
}

export function is_indestructible(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsIndestructible);
}

export function is_smart(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsSmart);
}

// Returns 0 if not limited
export function limited_max(item: TaggedEquippable): number {
    let lim_tag = tags(item).find(t => t.Tag.IsLimited);
    if (!lim_tag) {
        return 0;
    }
    return lim_tag.as_number(0);
}
