import { Bonus, Mech } from "./class";

// Same logic as interfaces, classes, etc.
export { parseContentPack } from "@src/io/ContentPackParser";
export { intake_pack } from "@src/classes/ContentPack";
export { get_base_content_pack } from "@src/io/ContentPackParser";
export { download_pilot, update_cloud_pilot, upload_new_pilot } from "@src/io/apis/gist";
export { cloud_sync } from "@src/classes/pilot/Pilot";
export { mech_cloud_sync } from "@src/classes/mech/Mech";

export function bound_int(x: number, min: number, max: number) {
    if (x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}

// Provides a helpful display of bonuses
export function contrib_helper(for_mech: Mech, bonus_id: string): string[] {
    let output: string[] = [];
    for_mech.AllBonuses.forEach(b => {
        if (b.ID == bonus_id) {
            let val = b.evaluate(for_mech.Pilot);
            const sign = val > -1 ? "+" : "-";
            output.push(`${b.Title ?? b.ID}: ${sign}${val}`);
        }
    });
    return output;
}
