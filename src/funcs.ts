import { Bonus, Mech } from "./class";

// Same logic as interfaces, classes, etc.
export { parseContentPack } from "@src/io/ContentPackParser";
export { intake_pack } from "@src/classes/ContentPack";
export { get_base_content_pack } from "@src/io/ContentPackParser";
export * as gist_io from "@src/io/apis/gist";
export { cloud_sync } from "@src/classes/pilot/Pilot";
export { mech_cloud_sync } from "@src/classes/mech/Mech";
export { validate_props } from "@src/classes/key_util";
export * as defaults from "@src/classes/default_entries";
export * as tag_util from "@src/classes/mech/EquipUtil";

export function bound_int(x: number, min: number, max: number) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}