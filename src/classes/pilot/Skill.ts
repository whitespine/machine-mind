import { Rules } from "@/class";
import { EntryType, RegEntry, Registry, SimSer } from "@/registry";
import { IRankedData } from "../GeneralInterfaces";

/*
This is serialized and deserialized very simply.
Regardless, we make it an entry just because it is more of a compendium thing, ya-feel?

TODO: Annihilate the concept of PilotSkill or RankedItem or whatever elsewehre so it is just stored in this
*/

export enum SkillFamily {
    str = "str",
    dex = "dex",
    int = "int",
    cha = "cha",
    con = "con",
    // custom = "custom"
}
export interface PackedSkillData {
    id: string;
    name: string;
    description: string; // terse, prefer fewest chars
    detail: string; // v-html
    family: SkillFamily;
}

export interface RegSkillData extends PackedSkillData {
    rank: number;
}

export class Skill extends RegEntry<EntryType.SKILL, RegSkillData> {
    ID!: string;
    Name!: string; // The trigger name
    Description!: string;
    Detail!: string;
    Family!: SkillFamily;
    Rank!: number;

    protected async load(data: RegSkillData): Promise<void> {
        (this.ID = data.id), (this.Name = data.name);
        this.Description = data.description;
        this.Detail = data.detail;
        this.Family = data.family;
        this.Rank = data.rank;
    }

    public async save(): Promise<RegSkillData> {
        return {
            description: this.Description,
            detail: this.Description,
            family: this.Family,
            id: this.Family,
            name: this.Name,
            rank: this.Rank,
        };
    }

    // Number go up (or down)
    public Increment(): boolean {
        if (this.Rank >= Rules.MaxTriggerRank) return false;
        this.Rank += 1;
        return true;
    }

    public Decrement(): boolean {
        if (this.Rank <= 1) return false;
        this.Rank -= 1;
        return false;
    }

    // Very simple. reg is kept for consistency
    public static async unpack(packed_skill: PackedSkillData, reg: Registry): Promise<Skill> {
        let rdata =  { ...packed_skill, rank: 1 };
        return reg.get_cat(EntryType.SKILL).create(rdata);
    }

    // Handles the tricky process of fetching skills via IRankedDaata
    public static async unpack_ranked_data(rank: IRankedData, reg: Registry): Promise<Skill> {
        // Find the appropriate skill
        let cat = reg.get_cat(EntryType.SKILL);
        let found = await cat.lookup_mmid(rank.id);

        // If found, just make us a copy
        if (found) {
            let cpy = await found.save();
            return cat.create(cpy);
        } else {
            // TODO
            throw new Error("Do not yet support custom skills cuz I am lazy");
        }
    }
}
