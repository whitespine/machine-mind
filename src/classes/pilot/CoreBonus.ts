import { Synergy, Bonus, Action, Counter, Deployable } from "@src/class";
import { defaults } from "@src/funcs";

import {
    IActionData,
    ISynergyData,
    PackedDeployableData,
    PackedCounterData,
    IBonusData,
} from "@src/interface";
import {
    EntryType,
    OpCtx,
    quick_mm_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
} from "@src/registry";
import { RegCounterData } from "../Counter";
import { Manufacturer } from "../Manufacturer";

// These attrs are shared
interface AllCoreBonusData {
    id: string;
    name: string;
    effect: string; // v-html
    description: string; // v-html
    mounted_effect?: string;
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
}
export interface PackedCoreBonusData extends AllCoreBonusData {
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    source: string; // must be the same as the Manufacturer ID to sort correctly
}

export interface RegCoreBonusData extends Required<AllCoreBonusData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    source: RegRef<EntryType.MANUFACTURER> | null; // _should_ never be null mechanically, but as always we must be error tolerant
}

export class CoreBonus extends RegEntry<EntryType.CORE_BONUS> {
    // Basic data
    ID!: string;
    Name!: string;
    Source!: Manufacturer | null; // No licensing info is needed other than manufacturer
    Description!: string;
    Effect!: string;
    MountedEffect!: string;

    // Common subfields
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any>[];

    public async load(data: RegCoreBonusData): Promise<void> {
        data = { ...defaults.CORE_BONUS(), ...data };
        this.ID = data.id;
        this.Name = data.name;
        this.Source = data.source ? await this.Registry.resolve(this.OpCtx, data.source) : null;
        this.Description = data.description;
        this.Effect = data.effect;
        this.MountedEffect = data.mounted_effect;
        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses, data.name);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables);
        this.Counters = SerUtil.process_counters(data.counters);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated);
    }
    public async save(): Promise<RegCoreBonusData> {
        return {
            description: this.Description,
            effect: this.Effect,
            id: this.ID,
            name: this.Name,
            source: this.Source?.as_ref() ?? null,
            actions: SerUtil.sync_save_all(this.Actions),
            bonuses: SerUtil.sync_save_all(this.Bonuses),
            counters: SerUtil.sync_save_all(this.Counters),
            deployables: SerUtil.ref_all(this.Deployables),
            integrated: SerUtil.ref_all(this.Integrated),
            mounted_effect: this.MountedEffect,
            synergies: SerUtil.sync_save_all(this.Synergies),
        };
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(cor: PackedCoreBonusData, reg: Registry, ctx: OpCtx): Promise<CoreBonus> {
        // Create deployable entries
        let dep_entries = await SerUtil.unpack_children(
            Deployable.unpack,
            reg,
            ctx,
            cor.deployables
        );
        let deployables = SerUtil.ref_all(dep_entries);

        // Get integrated refs
        let integrated = SerUtil.unpack_integrated_refs(cor.integrated || []);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(cor.counters);
        let cbdata: RegCoreBonusData = {
            ...defaults.CORE_BONUS(),
            ...cor,
            integrated,
            deployables,
            counters,
            source: quick_mm_ref(EntryType.MANUFACTURER, cor.source),
            mounted_effect: cor.mounted_effect ?? "",
            actions: cor.actions ?? [],
            bonuses: cor.bonuses ?? [],
            synergies: cor.synergies ?? [],
        };
        return reg.create_live(EntryType.CORE_BONUS, ctx, cbdata);
    }

    public get_child_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }
}
