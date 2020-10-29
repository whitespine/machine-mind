import { Action, Bonus, Counter, Deployable, MechEquipment, Synergy } from "@/class";
import {
    IActionData,
    IBonusData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
    RegCounterData,
} from "@/interface";
import { EntryType, RegEntry, RegRef, RoughRegRef, SerUtil } from "@/new_meta";

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
    integrated: RoughRegRef[];
}

export interface RegTalentData {
    id: string;
    name: string;
    icon: string; // Used internally
    icon_url: string; // Must be .svg
    terse: string; // terse text used in short descriptions. The fewer characters the better
    description: string; // v-html
    ranks: RegTalentRank[];
}

export interface TalentRank {
    name: string;
    description: string; // v-html
    exclusive: boolean; // see below
    actions: Action[];
    bonuses: Bonus[];
    synergies: Synergy[];
    deployables: Deployable[];
    counters: Counter[];
    integrated: RegEntry<any, any>[];
}

export class Talent extends RegEntry<EntryType.TALENT, RegTalentData> {
    ID!: string;
    Name!: string;
    Icon!: string;
    IconURL!: string;
    Terse!: string;
    Description!: string;

    Ranks!: Array<TalentRank>;

    protected async load(data: RegTalentData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Icon = data.icon;
        this.IconURL = data.icon_url;
        this.Terse = data.terse;
        this.Description = data.description;
        this.Ranks = [];
        for(let r of data.ranks) {
            this.Ranks.push({
                actions: SerUtil.process_actions(r.actions),
                bonuses: SerUtil.process_bonuses(r.bonuses),
                counters: SerUtil.process_counters(r.counters),
                deployables: await this.Registry.resolve_many(r.deployables),
                description: r.description,
                exclusive: r.exclusive,
                integrated: await this.Registry.resolve_many_rough(r.integrated),
                name: r.name,
                synergies: SerUtil.process_synergies(r.synergies)
            })
        }
    }

    public async save(): Promise<RegTalentData> {
        let ranks: RegTalentRank[] = [];
        for (let r of this.Ranks) {
            ranks.push({
                description: r.description,
                exclusive: r.exclusive,
                name: r.name,
                actions: SerUtil.sync_save_all(r.actions),
                bonuses: SerUtil.sync_save_all(r.bonuses),
                integrated: SerUtil.ref_all(r.integrated),
                counters: SerUtil.sync_save_all(r.counters),
                synergies: SerUtil.sync_save_all(r.synergies),
                deployables: SerUtil.ref_all(r.deployables)
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
        };
    }

    // Get the rank at the specified number, or null if it doesn't exist. One indexed
    public Rank(rank: number): TalentRank | null {
        if (this.Ranks[rank - 1]) {
            return this.Ranks[rank - 1];
        }
        console.error(`Talent ${this.ID}/${this.Name} does not contain rank ${rank} data`);
        return null;
    }

    // List all items / ownerships granted by this talent, through all ranks
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
