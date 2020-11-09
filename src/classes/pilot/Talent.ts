import { Action, Bonus, Counter, Deployable, FrameTrait, MechEquipment, Synergy } from "@src/class";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
    RegCounterData,
} from "@src/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";

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
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
}

// A full talent composed of several ranks in the raw data
export interface PackedTalentData {
    id: string;
    name: string;
    icon: string; // Used internally
    icon_url: string; // Must be .svg
    terse: string; // terse text used in short descriptions. The fewer characters the better
    description: string; // v-html
    ranks: PackedTalentRank[];
}

// Our canonical form of a rank
export interface RegTalentRank {
    name: string;
    description: string; // v-html
    exclusive: boolean; // see below
    actions: IActionData[];
    bonuses: IBonusData[];
    synergies: ISynergyData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export interface RegTalentData {
    id: string;
    name: string;
    icon: string; // Used internally
    icon_url: string; // Must be .svg
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
    Integrated: RegEntry<any, any>[];
}

export class Talent extends RegEntry<EntryType.TALENT, RegTalentData> {
    ID!: string;
    Name!: string;
    Icon!: string;
    IconURL!: string;
    Terse!: string;
    Description!: string;

    Ranks!: Array<TalentRank>;
    CurrentRank!: number;

    public async load(data: RegTalentData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Icon = data.icon;
        this.IconURL = data.icon_url;
        this.Terse = data.terse;
        this.Description = data.description;
        this.Ranks = [];
        for (let r of data.ranks) {
            this.Ranks.push({
                Actions: SerUtil.process_actions(r.actions),
                Bonuses: SerUtil.process_bonuses(
                    r.bonuses,
                    `TALENT ${r.name} RANK ${this.Ranks.length + 1}`
                ),
                Counters: SerUtil.process_counters(r.counters),
                Deployables: await this.Registry.resolve_many(r.deployables, this.OpCtx),
                Description: r.description,
                Exclusive: r.exclusive,
                Integrated: await this.Registry.resolve_many_rough(r.integrated, this.OpCtx),
                Name: r.name,
                Synergies: SerUtil.process_synergies(r.synergies),
            });
        }
        this.CurrentRank = data.curr_rank;
    }

    public async save(): Promise<RegTalentData> {
        let ranks: RegTalentRank[] = [];
        for (let r of this.Ranks) {
            ranks.push({
                description: r.Description,
                exclusive: r.Exclusive,
                name: r.Name,
                actions: SerUtil.sync_save_all(r.Actions),
                bonuses: SerUtil.sync_save_all(r.Bonuses),
                integrated: SerUtil.ref_all(r.Integrated),
                counters: SerUtil.sync_save_all(r.Counters),
                synergies: SerUtil.sync_save_all(r.Synergies),
                deployables: SerUtil.ref_all(r.Deployables),
            });
        }

        return {
            description: this.Description,
            icon: this.Icon,
            icon_url: this.IconURL,
            id: this.ID,
            name: this.Name,
            terse: this.Terse,
            ranks,
            curr_rank: this.CurrentRank,
        };
    }

    public static async unpack(data: PackedTalentData, reg: Registry): Promise<Talent> {
        // Process talent ranks
        let ranks: RegTalentRank[] = [];
        for (let r of data.ranks) {
            ranks.push({
                name: r.name,
                description: r.description,
                exclusive: r.exclusive,
                ...(await SerUtil.unpack_commons_and_tags(r, reg)),
                counters: SerUtil.unpack_counters_default(r.counters),
                integrated: SerUtil.unpack_integrated_refs(r.integrated),
            });
        }

        // Finish with entire reg
        let rdata: RegTalentData = {
            ...data,
            ranks,
            curr_rank: 1,
        };
        return reg.get_cat(EntryType.TALENT).create(rdata);
    }
    // Get the rank at the specified number, or null if it doesn't exist. One indexed
    public Rank(rank: number): TalentRank | null {
        if (this.Ranks[rank - 1]) {
            return this.Ranks[rank - 1];
        }
        console.error(`Talent ${this.ID}/${this.Name} does not contain rank ${rank} data`);
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

    public get Integrated(): RegEntry<any, any>[] {
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

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    // TODO: Handle exclusive
}

/*
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
*/
