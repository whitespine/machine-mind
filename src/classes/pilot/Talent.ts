import { CompendiumItem } from "@/class";
import { ICompendiumItemData } from "@/interface";
import { store } from "@/hooks";

export interface ITalentRank {
    name: string;
    description: string;
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
