// Same logic as interfaces, classes, etc.
export { accentFold, accentInclude } from "@/classes/utility/accent_fold";
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
