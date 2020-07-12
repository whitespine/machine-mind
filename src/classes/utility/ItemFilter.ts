import { MechEquipment, CompendiumItem } from "@/class";
import { Mech } from "../mech/Mech";

export class ItemFilter {
    public static Filter(items: CompendiumItem[], filter: any): CompendiumItem[] {
        Object.keys(filter).forEach(p => {
            if (p === "Tags") {
                items = items.filter(e =>
                    (e as MechEquipment).Tags.map(t => t.ID).some(x => filter.Tags.includes(x))
                );
            } else if (filter[p].length)
                items = items.filter(x => filter[p].some((e: any) => x[p].includes(e)));
        });
        return items;
    }
}
