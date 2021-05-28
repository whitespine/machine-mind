import { Counter } from "./class";
import { SourcedCounter } from "./interface";
import { EntryType, LiveEntryTypes } from "./registry";

// Same logic as interfaces, classes, etc.
export { parseContentPack } from "@src/io/ContentPackParser";
export { intake_pack } from "@src/classes/ContentPack";
export { get_base_content_pack } from "@src/io/ContentPackParser";
export * as gist_io from "@src/io/apis/gist";
export { cloud_sync } from "@src/classes/pilot/Pilot";
export { mech_cloud_sync } from "@src/classes/mech/Mech";
export { npc_cloud_sync } from "@src/classes/npc/Npc";
export { validate_props } from "@src/classes/key_util";
export * as defaults from "@src/classes/default_entries";
export * as tag_util from "@src/classes/mech/EquipUtil";
export { weapon_size_magnitude } from "@src/classes/mech/MechLoadout";
export {nanoid} from "nanoid";

// We oftentimes need to make sure we don't go outside of allowed ranges
export function bound_int(x: number, min: number, max: number) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}

// Useful for just showing the true values of checklists
export function list_truthy_keys(of_dict: { [key: string]: any }): string[] {
    let result: string[] = [];
    for (let k of Object.keys(of_dict)) {
        if (of_dict[k]) {
            result.push(k);
        }
    }
    return result;
}


// Converts things like "LEAVIATHAN HEAVY ASSAULT CANNON" into "leaviathan_heavy_assault_cannon"
export function lid_format_name(name: string): string {
    return name.trim().replace(/[:\\\/-\s]+/g, "_").toLowerCase();
}

// Remove all undefined from an object
export function remove_undefined<T>(item: T): {
    [K in keyof T]: Exclude<T[K], undefined>;
} {
    for(let key of Object.keys(item)) {
        if(item[key] === undefined) {
            delete item[key];
        }
    }
    return item as any;
}

export function remove_null<T>(item: T): {
    [K in keyof T]: Exclude<T[K], null>;
} {
    for(let key of Object.keys(item)) {
        if(item[key] === null) {
            delete item[key];
        }
    }
    return item as any;
}

export function remove_nullish<T>(item: T): {
    [K in keyof T]: Exclude<T[K], undefined | null>;
} {
    for(let key of Object.keys(item)) {
        if(item[key] == undefined) {
            delete item[key];
        }
    }
    return item as any;
}

export function source_all_counters<T extends EntryType>(from_list: (LiveEntryTypes<T> & {Counters: Counter[]})[]): SourcedCounter<T>[] {
    // Collect counters from the given array of items, marking each with its source entity
    return from_list.flatMap(t => t.Counters.map(c => c.mark_sourced(t)));
}