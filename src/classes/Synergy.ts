import { MechEquipment, Pilot, MechWeapon, ItemType, MechSystem, Frame } from "@/class";

export interface ISynergyItem {
    locations: string[];
    types?: string[];
    sizes?: string[];
    detail: string;
}

export interface ISynergyDecorator {
    title: string;
    synergy: ISynergyItem;
}

export class Synergy {
    public static TalentSynergies(
        item: MechEquipment,
        pilot: Pilot,
        location: string
    ): ISynergyDecorator[] {
        let synergies: ISynergyDecorator[] = [];
        const type =
            item.ItemType === ItemType.MechWeapon
                ? (item as MechWeapon).Type
                : (item as MechSystem).Type;
        const size = item.ItemType === ItemType.MechWeapon ? (item as MechWeapon).Size : "any";

        for(let pt of pilot.Talents) {
            let i = 0;
            for(let rank of pt.UnlockedRanks) {
                let rank_synergies = rank.synergies || [];
                for (let s of rank_synergies) {
                    synergies.push({
                        title: `${pt.Talent.Name} RANK ${"I".repeat(++i)}//${pt.Talent.Rank(i).name}`,
                        synergy: s,
                    });
                }
            }
        }

        synergies = synergies.filter(
            x =>
                (!x.synergy.locations ||
                    x.synergy.locations.includes(location) ||
                    x.synergy.locations.includes("any")) &&
                (!x.synergy.types ||
                    x.synergy.types.includes(type) ||
                    x.synergy.types.includes("any")) &&
                (!x.synergy.sizes ||
                    x.synergy.sizes.includes(size) ||
                    x.synergy.sizes.includes("any"))
        );

        return synergies;
    }

    public static FrameSynergies(frame: Frame, location: string): ISynergyDecorator[] {
        let synergies: ISynergyDecorator[] = [];
        for (let t of frame.Traits) {
            for (let s of t.synergies || []) {
                synergies.push({
                    title: t.name,
                    synergy: s,
                });
            }
        }

        synergies = synergies.filter(
            x =>
                !x.synergy.locations ||
                x.synergy.locations.includes(location) ||
                x.synergy.locations.includes("any")
        );

        return synergies;
    }
}
