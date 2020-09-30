import { ItemType} from "@/class";

// items that are stored as compendium data, refernced by ID and contain
// at minimum a name, itemtype, and brew

// This entity lives in our registry, and is "indexable" for lack of a better word
export interface VRegistryItem {
    readonly ID: string;
    readonly Name: string;
    readonly Type: ItemType;
    // readonly Description: string;
    readonly Brew: string;
}

// Any item that will be accessible via registry must at least bear these two tags
export interface IRegistryItemData {
  id: string
  name: string
  // type: ItemType; // Note that this DOESN'T COME FREE! We MUST add it if not initially present when we intake items
  // description: string
  // brew?: string -- deduced separately
  // counters?: ICounterData[]
}
