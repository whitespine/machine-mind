import { Synergy, Bonus, Action, Counter, Deployable } from "@src/class";
import { defaults } from "@src/funcs";

import {
    PackedDeployableData,
    PackedCounterData,
    RegBonusData,
    PackedBonusData,
    RegActionData,
    PackedActionData,
    ISynergyData,
    RegCounterData,
} from "@src/interface";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SerUtil,
} from "@src/registry";
import { Manufacturer } from "@src/class";
import { merge_defaults } from "../default_entries";

// These attrs are shared
interface AllCoreBonusData {
    name: string;
    effect: string; // v-html
    description: string; // v-html
    mounted_effect?: string;
    synergies?: ISynergyData[];
}
export interface PackedCoreBonusData extends AllCoreBonusData {
    id: string;
    bonuses?: PackedBonusData[];
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    source: string; // must be the same as the Manufacturer ID to sort correctly
    actions?: PackedActionData[];
}

export interface RegCoreBonusData extends Required<AllCoreBonusData> {
    lid: string;
    bonuses: RegBonusData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    source: RegRef<EntryType.MANUFACTURER> | null; // _should_ never be null mechanically, but as always we must be error tolerant
    actions: RegActionData[];
}

export class CoreBonus extends RegEntry<EntryType.CORE_BONUS> {
    // Basic data
    LID!: string;
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
        merge_defaults(data, defaults.CORE_BONUS());
        this.LID = data.lid;
        this.Name = data.name;
        this.Source = data.source
            ? await this.Registry.resolve(this.OpCtx, data.source, { wait_ctx_ready: false })
            : null;
        this.Description = data.description;
        this.Effect = data.effect;
        this.MountedEffect = data.mounted_effect;
        this.Actions = SerUtil.process_actions(data.actions);
        this.Bonuses = SerUtil.process_bonuses(data.bonuses, data.name);
        this.Synergies = SerUtil.process_synergies(data.synergies);
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables, {
            wait_ctx_ready: false,
        });
        this.Counters = SerUtil.process_counters(data.counters);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {
            wait_ctx_ready: false,
        });
    }

    protected save_imp(): RegCoreBonusData {
        return {
            description: this.Description,
            effect: this.Effect,
            lid: this.LID,
            name: this.Name,
            source: this.Source?.as_ref() ?? null,
            actions: SerUtil.save_all(this.Actions),
            bonuses: SerUtil.save_all(this.Bonuses),
            counters: SerUtil.save_all(this.Counters),
            deployables: SerUtil.ref_all(this.Deployables),
            integrated: SerUtil.ref_all(this.Integrated),
            mounted_effect: this.MountedEffect,
            synergies: SerUtil.save_all(this.Synergies),
        };
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(data: PackedCoreBonusData, reg: Registry, ctx: OpCtx): Promise<CoreBonus> {
        // Create deployable entries
        let dep_entries = await Promise.all(
            (data.deployables ?? []).map(i => Deployable.unpack(i, reg, ctx, data.id))
        );
        let deployables = SerUtil.ref_all(dep_entries);

        // Get integrated refs
        let integrated = SerUtil.unpack_integrated_refs(reg, data.integrated);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(data.counters);
        let cbdata: RegCoreBonusData = merge_defaults(
            {
                lid: data.id,
                name: data.name,
                description: data.description,
                effect: data.effect,
                integrated,
                deployables,
                counters,
                source: quick_local_ref(reg, EntryType.MANUFACTURER, data.source),
                mounted_effect: data.mounted_effect ?? "",
                actions: (data.actions ?? []).map(Action.unpack),
                bonuses: (data.bonuses ?? []).map(Bonus.unpack),
                synergies: data.synergies ?? [],
            },
            defaults.CORE_BONUS()
        );
        return reg.get_cat(EntryType.CORE_BONUS).create_live(ctx, cbdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public async emit(): Promise<PackedCoreBonusData> {
        return {
            id: this.LID,
            name: this.Name,
            description: this.Description,

            effect: this.Effect,
            mounted_effect: this.MountedEffect,

            source: this.Source?.LID ?? "GMS",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            counters: await SerUtil.emit_all(this.Counters),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            integrated: this.Integrated.map(i => (i as any).LID ?? ""),
        };
    }
}
