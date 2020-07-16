import { MechEquipment, CompendiumItem } from "@/class";
import { Mech } from "../mech/Mech";

export interface ItemFilterParam {
    Tags: string[]; // The tag IDs
    [key: string]: string[]; // Other options for other things
}

export class ItemFilter {
    public static Filter(items: CompendiumItem[], filter: ItemFilterParam): CompendiumItem[] {
        Object.keys(filter).forEach(p => {
            if (p === "Tags") {
                items = items.filter(e =>
                    (e as MechEquipment).Tags.map(t => t.ID).some(x => filter.Tags.includes(x))
                );
            } else if (filter[p].length)
                items = items.filter(x => filter[p].some((e: any) => x[p].includes(e)));
            // For each x of items, check if filter array p has any item e such that x[p] (presumed to be a string) includes e
        });
        return items;
    }
}
