import { Bonus, Mech } from './class';

// Same logic as interfaces, classes, etc.
export { parseContentPack } from "@/io/ContentPackParser";
export { getBaseContentPack } from "@/classes/registry";
export { getChangelog, getCredits, loadPilot, newPilot, savePilot } from "@/io/apis/gist";

export function bound_int(x: number, min: number, max: number) {
    if(x < min) {
        return min;
    } else if (x > max) {
        return max;
    } else {
        return x;
    }
}

// Provides a helpful display
export function contrib_helper(for_mech: Mech, bonusName: string): string[] {
    let output: string[] = [];
    Bonus.Contributors(bonusName, for_mech).forEach(b => {
        const sign = b.val > -1 ? "+" : "-";
        output.push(`${b.name}: ${sign}${b.val}`);
    });
    return output;
}