import { ItemType, Action, Bonus, Synergy, Deployable, Counter } from "@/class";

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew

// Many of our "classes" extend this to indicate that they are hosted/managed by the compendium structure
// Has an ID and type, as well as tracks the brew it came from
export interface VCompendiumItem {
    readonly ID: string;
    readonly Name: string;
    readonly Type: ItemType;
    readonly Brew: string;
}