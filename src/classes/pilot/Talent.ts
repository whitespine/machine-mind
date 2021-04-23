import { Action, Bonus, Counter, Deployable, FrameTrait, MechEquipment, Synergy } from "@src/class";
import { defaults } from "@src/funcs";
import {
    PackedActionData,
    RegActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
    RegCounterData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { merge_defaults } from "../default_entries";
import { PackedRankedData } from "../GeneralInterfaces";

// Denotes an item bestowed by a talent. May be vestigial
export interface ITalentItemData {
    type: string;
    id: string;
    exclusive?: boolean; // This means that this item supercedes lower ranked versions
}

// A talent rank in the raw data
export interface PackedTalentRank {
    name: string;
    description: string; // v-html
    exclusive: boolean; // see below
    actions?: PackedActionData[];
    bonuses?: PackedBonusData[];
    synergies?: ISynergyData[];
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
}

// A full talent composed of several ranks in the raw data
export interface PackedTalentData {
    id: string;
    name: string;
    icon: string;
    terse: string; // terse text used in short descriptions. The fewer characters the better
    description: string; // v-html
    ranks: PackedTalentRank[];
}

// Our canonical form of a rank
export interface RegTalentRank {
    name: string;
    description: string; // v-html
    exclusive: boolean; // see below
    actions: RegActionData[];
    bonuses: RegBonusData[];
    synergies: ISynergyData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export interface RegTalentData {
    lid: string;
    name: string;
    icon: string;
    terse: string; // terse text used in short descriptions. The fewer characters the better
    description: string; // v-html
    ranks: RegTalentRank[];
    curr_rank: number; // 1, 2, or 3, typically
}

export interface TalentRank {
    Name: string;
    Description: string; // v-html
    Exclusive: boolean;
    Actions: Action[];
    Bonuses: Bonus[];
    Synergies: Synergy[];
    Deployables: Deployable[];
    Counters: Counter[];
    Integrated: RegEntry<any>[];
}

export class Talent extends RegEntry<EntryType.TALENT> {
    LID!: string;
    Name!: string;
    Icon!: string;
    Terse!: string;
    Description!: string;

    Ranks!: Array<TalentRank>;
    CurrentRank!: number;

    public async load(data: RegTalentData): Promise<void> {
        merge_defaults(data, defaults.TALENT());
        this.LID = data.lid;
        this.Name = data.name;
        this.Icon = data.icon;
        this.Terse = data.terse;
        this.Description = data.description;
        this.Ranks = [];
        for (let r of data.ranks) {
            merge_defaults(r, defaults.TALENT_RANK());
            this.Ranks.push({
                Actions: SerUtil.process_actions(r.actions),
                Bonuses: SerUtil.process_bonuses(
                    r.bonuses,
                    `TALENT ${r.name} RANK ${this.Ranks.length + 1}`
                ),
                Counters: SerUtil.process_counters(r.counters),
                Deployables: await this.Registry.resolve_many(this.OpCtx, r.deployables),
                Description: r.description,
                Exclusive: r.exclusive,
                Integrated: await this.Registry.resolve_many_rough(this.OpCtx, r.integrated),
                Name: r.name,
                Synergies: SerUtil.process_synergies(r.synergies),
            });
        }
        this.CurrentRank = data.curr_rank;
    }

    protected save_imp(): RegTalentData {
        let ranks: RegTalentRank[] = [];
        for (let r of this.Ranks) {
            ranks.push({
                description: r.Description,
                exclusive: r.Exclusive,
                name: r.Name,
                actions: SerUtil.save_all(r.Actions),
                bonuses: SerUtil.save_all(r.Bonuses),
                integrated: SerUtil.ref_all(r.Integrated),
                counters: SerUtil.save_all(r.Counters),
                synergies: SerUtil.save_all(r.Synergies),
                deployables: SerUtil.ref_all(r.Deployables),
            });
        }

        return {
            description: this.Description,
            icon: this.Icon,
            lid: this.LID,
            name: this.Name,
            terse: this.Terse,
            ranks,
            curr_rank: this.CurrentRank,
        };
    }

    public static async unpack(data: PackedTalentData, reg: Registry, ctx: OpCtx): Promise<Talent> {
        // Process talent ranks
        let ranks: RegTalentRank[] = [];
        for (let r of data.ranks) {
            ranks.push(merge_defaults({
                name: r.name,
                description: r.description,
                ...(await SerUtil.unpack_basdt({ id: data.id, ...r }, reg, ctx)),
                counters: SerUtil.unpack_counters_default(r.counters),
                integrated: SerUtil.unpack_integrated_refs(reg, r.integrated),
            }, defaults.TALENT_RANK()));
        }

        // Finish with entire reg
        let rdata: RegTalentData = merge_defaults({
            description: data.description,
            icon: data.icon,
            name: data.name,
            terse: data.terse,
            lid: data.id,
            ranks,
            curr_rank: 1,
        }, defaults.TALENT());
        return reg.get_cat(EntryType.TALENT).create_live(ctx, rdata);
    }
    // Get the rank at the specified number, or null if it doesn't exist. One indexed
    public Rank(rank: number): TalentRank | null {
        if (this.Ranks[rank - 1]) {
            return this.Ranks[rank - 1];
        }
        console.error(`Talent ${this.LID}/${this.Name} does not contain rank ${rank} data`);
        return null;
    }

    // The ranks granted by our current level
    public get UnlockedRanks(): TalentRank[] {
        return this.Ranks.slice(0, this.CurrentRank);
    }

    // Flattening methods
    public get Counters(): Counter[] {
        return this.UnlockedRanks.flatMap(x => x.Counters);
    }

    public get Integrated(): RegEntry<any>[] {
        return this.UnlockedRanks.flatMap(x => x.Integrated);
    }

    public get Deployables(): Deployable[] {
        return this.UnlockedRanks.flatMap(x => x.Deployables);
    }

    public get Actions(): Action[] {
        return this.UnlockedRanks.flatMap(x => x.Actions);
    }

    public get Bonuses(): Bonus[] {
        return this.UnlockedRanks.flatMap(x => x.Bonuses);
    }

    public get Synergies(): Synergy[] {
        return this.UnlockedRanks.flatMap(x => x.Synergies);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    // TODO: Handle exclusive

    public async emit(): Promise<PackedTalentData> {
        let ranks: PackedTalentRank[] = [];
        for(let rank of this.Ranks) {
            ranks.push({
                description: rank.Description,
                exclusive: rank.Exclusive,
                name: rank.Name,
                actions: await SerUtil.emit_all(rank.Actions),
                bonuses: await SerUtil.emit_all(rank.Bonuses),
                counters: await SerUtil.emit_all(rank.Counters),
                synergies: await SerUtil.emit_all(rank.Synergies),
                deployables: await SerUtil.emit_all(rank.Deployables),
                integrated: rank.Integrated.map(i => (i as any).LID),
            });
        }
        return {
            description: this.Description,
            icon: this.Icon,
            id: this.LID,
            name: this.Name,
            terse: this.Terse,
            ranks
        };
    }
}