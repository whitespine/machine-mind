import { MechWeapon, TagInstance } from "@src/class";

// Returns all tags on a mech equippable
// Mech weapons returns across all profiles.
// If you want more specific, provide a profile instead
export type TaggedEquippable = MechWeapon | { Tags: TagInstance[] };
function tags(item: TaggedEquippable): TagInstance[] {
    if (item instanceof MechWeapon) {
        return item.Profiles.flatMap(p => p.Tags);
    } else {
        return item.Tags;
    }
}

export function is_tagged(item: any): item is TaggedEquippable {
    return item instanceof MechWeapon || Array.isArray((item as any).Tags); // We trust that the tags are tags
}

export function is_unique(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsUnique);
}

export function is_ai(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsAI);
}

export function is_ap(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsAP);
}

export function is_limited(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsLimited);
}

export function is_loading(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsLoading);
}

export function is_recharge(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsRecharge);
}

export function is_indestructible(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsIndestructible);
}

export function is_smart(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsSmart);
}

export function is_seeking(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsSeeking);
}

export function is_overkill(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsOverkill);
}

export function is_accurate(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsAccurate);
}

export function is_inaccurate(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsInaccurate);
}

export function is_reliable(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsReliable);
}

export function is_self_heat(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsSelfHeat);
}

export function is_knockback(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsKnockback);
}

export function is_overshield(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsOvershield);
}

export function is_cascade_resistant(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsCascadeResistant);
}

export function is_ordnance(item: TaggedEquippable): boolean {
    return !!tags(item).find(t => t.Tag.IsOrdnance);
}




// Returns 0 if not limited
export function limited_max(item: TaggedEquippable): number {
    let lim_tag = tags(item).find(t => t.Tag.IsLimited);
    if (!lim_tag) {
        return 0;
    }
    return lim_tag.as_number(0);
}

// Returns 0 if not recharge
export function get_recharge(item: TaggedEquippable): number {
    let lim_tag = tags(item).find(t => t.Tag.IsRecharge);
    if (!lim_tag) {
        return 0;
    }
    return lim_tag.as_number(0);
}
export const recharge_value = get_recharge; // Back-compat

// Returns 0 if not reliable
export function get_reliable(item: TaggedEquippable): number {
    let rel_tag = tags(item).find(t => t.Tag.IsReliable);
    if (!rel_tag) {
        return 0;
    }
    return rel_tag.as_number(0);
}

// Returns 0 if not heat
export function get_self_heat(item: TaggedEquippable): number {
    let rel_tag = tags(item).find(t => t.Tag.IsSelfHeat);
    if (!rel_tag) {
        return 0;
    }
    return rel_tag.as_number(0);
}

// Returns 0 if not knockback
export function get_knockback(item: TaggedEquippable): number {
    let rel_tag = tags(item).find(t => t.Tag.IsKnockback);
    if (!rel_tag) {
        return 0;
    }
    return rel_tag.as_number(0);
}

// Returns 0 if not overshield
export function get_overshield(item: TaggedEquippable): number {
    let rel_tag = tags(item).find(t => t.Tag.IsOvershield);
    if (!rel_tag) {
        return 0;
    }
    return rel_tag.as_number(0);
}



// 
/** Merges tag arrays. Creates a new array, of new tag instances
 * Tags are merged as follows:
 * - For limited, the lower value is preserved
 * - For recharge, the higher value is preserved (unlikely to matter)
 * - For heat, the values are summed 
 * - For reliable, the values are summed 
 * - For knockback, the values are summed
 * - For overshield, the values are summed
 * - Accuracy and difficulty are kepts as unique instances, allowing duplicates
 * - Otherwise, duplicate is discarded
 */
export function merge_tags(...tag_arrays: TagInstance[][]): TagInstance[] {
    if(!tag_arrays.length) return [];

    // Create a cloned array of the first tag array
    let result: TagInstance[] = []; 

    // Build a cache as we go so we don't have to .find constantly
    let cache: {[key: string]: TagInstance | undefined} = {};

    // And, go!
    for(let add_tag of tag_arrays.flat()) {
        // Find duplicate if it exists
        let clone = cache[add_tag.Tag.LID];

        if(!clone) {
            // If it doesn't, we always append
            let d = add_tag.dup();
            cache[add_tag.Tag.LID] = d;
            result.push(d);
        } else {
            // If it does, we merge as specified above
            let t = clone.Tag;
            if(t.IsReliable || t.IsSelfHeat || t.IsKnockback || t.IsOvershield) {
                (clone.Value as number) += add_tag.as_number();
            } else if(t.IsAccurate || t.IsInaccurate) {
                result.push(add_tag.dup());
            } else if (t.IsLimited) {
                clone.Value = Math.min(clone.as_number(), add_tag.as_number())
            } else if (t.IsRecharge) {
                clone.Value = Math.max(clone.as_number(), add_tag.as_number())
            } else {
                // Discard it - we already have it and it doesn't have a special merger rule
            }
        }
    }

    return result;
}