import { Rules } from "@src/class";
import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry } from "@src/registry";

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
    rank?: number;
    custom?: true;
    custom_desc?: string;
    custom_detail?: string;
}

export interface RegSkillData {
    lid: string;
    name: string;
    description: string; // terse, prefer fewest chars
    detail: string; // v-html
    family: SkillFamily;
    rank: number;
}

export class Skill extends RegEntry<EntryType.SKILL> {
    ID!: string;
    Name!: string; // The trigger name
    Description!: string;
    Detail!: string;
    Family!: SkillFamily;
    CurrentRank!: number;

    public async load(data: RegSkillData): Promise<void> {
        data = { ...defaults.SKILL(), ...data };
        this.ID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Detail = data.detail;
        this.Family = data.family;
        this.CurrentRank = data.rank;
    }

    protected save_imp(): RegSkillData {
        return {
            description: this.Description,
            detail: this.Detail,
            family: this.Family,
            lid: this.ID,
            name: this.Name,
            rank: this.CurrentRank,
        };
    }

    // Number go up (or down)
    public Increment(): boolean {
        if (this.CurrentRank >= Rules.MaxTriggerRank) return false;
        this.CurrentRank += 1;
        return true;
    }

    public Decrement(): boolean {
        if (this.CurrentRank <= 1) return false;
        this.CurrentRank -= 1;
        return false;
    }

    // Very simple.
    public static async unpack(
        packed_skill: PackedSkillData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Skill> {
        let rdata = { 
            ...defaults.SKILL(), 
            lid: packed_skill.id,
            name: packed_skill.name ?? packed_skill.id
        };
        // Default the name
        rdata.name = packed_skill.name ?? rdata.lid;
        return reg.get_cat(EntryType.SKILL).create_live(ctx, rdata);
    }
}
