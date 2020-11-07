import { Bonus, Mech } from "./class";

// Same logic as interfaces, classes, etc.
export { parseContentPack } from "@/io/ContentPackParser";
export { intake_pack } from "@/classes/ContentPack";
export { get_base_content_pack } from "@/io/ContentPackParser";
export { getChangelog, getCredits, loadPilot, newPilot, savePilot } from "@/io/apis/gist";

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
        if(b.ID == bonus_id) {
            let val = b.evaluate(for_mech.Pilot);
            const sign = val > -1 ? "+" : "-";
            output.push(`${b.Title ?? b.ID}: ${sign}${val}`);
        }
    });
    return output;
}
