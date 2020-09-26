import { ItemType, Action, Bonus, Synergy, Deployable, Counter } from "@/class";
import { ICounterData } from '@/interface';

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew

// Many of our "classes" extend this to indicate that they are hosted/managed by the compendium structure
// Has an ID and type, as well as tracks the brew it came from
export interface VCompendiumItem {
    readonly ID: string;
    readonly Name: string;
    readonly Type: ItemType;
    readonly Description: string;
    readonly Brew: string;
}

/*
I am admittedly not _entirely_ sure why this is whaat it is. But it is, so.... guess we just gotta deal
*/

export interface ICompendiumItemData {
  id: string
  name: string
  description: string
  brew?: string
  STINKY: "yes"
  // counters?: ICounterData[]
}
