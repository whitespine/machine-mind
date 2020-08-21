import { CompendiumItem, MechEquipment } from "@/class";
import { ICompendiumItemData, ISynergyItem, IAction } from "@/interface";
import { store } from "@/hooks";

export interface ITalentRank {
    name: string;
    description: string;
    synergies?: ISynergyItem[];
    actions?: IAction[];
    talent_item?: ITalentItemData;
}

export interface ITalentItemData {
    type: string;
    id: string;
    exclusive?: boolean; // This means that this item supercedes lower ranked versions
}

export interface ITalentData extends ICompendiumItemData {
    ranks: ITalentRank[];
}

export class Talent extends CompendiumItem {
    private _ranks: ITalentRank[];

    public constructor(talentData: any) {
        super(talentData);
        this._ranks = talentData.ranks;
    }

    public get Ranks(): ITalentRank[] {
        return this._ranks;
    }

    public Rank(rank: number): ITalentRank {
        if (this._ranks[rank - 1]) return this._ranks[rank - 1];
        console.error(`Talent ${this.ID}/${this.Name} does not contain rank ${rank} data`);
        return { name: "", description: "" };
    }

    public static Deserialize(id: string): Talent {
        let v = store.compendium.getReferenceByID("Talents", id);
        return v;
    }
}

export class TalentRankUtil {
    public static Synergies(tr: ITalentRank) {
        return;
    }

    public static Actions(tr: ITalentRank): IAction[] {
        if (!tr.actions) {
            return [];
        }
        return tr.actions;
    }

    public static Item(tr: ITalentRank): MechEquipment | null {
        if (!tr.talent_item) {
            return null;
        }
        const t = tr.talent_item.type === "weapon" ? "MechWeapons" : "MechSystems";
        return store.compendium.getReferenceByID(t, tr.talent_item.id);
    }

    public static AllTalentItems(t: Talent, r: number): MechEquipment[] {
        let talent_items: MechEquipment[] = [];
        //let exclusive = null

        for (let i = 0; i < r - 1; i++) {
            const tr = t.Ranks[i];
            if (tr.talent_item && !tr.talent_item.exclusive) {
                talent_items.push(this.Item(tr)!);
            } else if (tr.talent_item && tr.talent_item.exclusive) {
                // Replace rest of list if exclusive
                talent_items = [this.Item(tr)!];
            }
        }

        return talent_items;
    }
}
