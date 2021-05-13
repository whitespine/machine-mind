import { Action, Bonus, Counter, Deployable, MechWeapon, Synergy, TagInstance } from "@src/class";
import { defaults, lid_format_name } from "@src/funcs";
import {
    PackedActionData,
    RegActionData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegTagInstanceData,
    PackedBonusData,
    RegBonusData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@src/registry";
import { ActivationType, FrameEffectUse } from "@src/enums";
import { merge_defaults } from "../default_entries";

export interface AllCoreSystemData {
    name: string;
    description: string; // v-html
    activation: ActivationType;
    deactivation?: ActivationType;
    use?: FrameEffectUse;

    //
    active_name: string;
    active_effect: string; // v-html
    active_synergies: ISynergyData[];

    // Basically the same but passives
    passive_name?: string;
    passive_effect?: string; // v-html,
    passive_synergies?: ISynergyData[];

    // And all the rest
}

export interface PackedCoreSystemData extends AllCoreSystemData {
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    tags: PackedTagInstanceData[];
    active_bonuses?: PackedBonusData[];
    passive_bonuses?: PackedBonusData[];
    active_actions?: PackedActionData[];
    passive_actions?: PackedActionData[];
}

export interface RegCoreSystemData extends Required<AllCoreSystemData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    tags: RegTagInstanceData[];
    active_bonuses: RegBonusData[];
    passive_bonuses: RegBonusData[];
    active_actions: RegActionData[];
    passive_actions: RegActionData[];
}

export class CoreSystem extends RegSer<RegCoreSystemData> {
    Name!: string;
    Description!: string;

    Activation!: ActivationType;
    Deactivation!: ActivationType; // If null, will have the "none" enum option
    Use!: FrameEffectUse;

    ActiveName!: string;
    ActiveEffect!: string;
    ActiveActions!: Action[];
    ActiveBonuses!: Bonus[];
    ActiveSynergies!: Synergy[];

    PassiveName!: string;
    PassiveEffect!: string;
    PassiveActions!: Action[];
    PassiveBonuses!: Bonus[];
    PassiveSynergies!: Synergy[];

    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any>[];
    Tags!: TagInstance[];

    public async load(data: RegCoreSystemData): Promise<void> {
        merge_defaults(data, defaults.CORE_SYSTEM());
        this.Activation = data.activation;
        this.Description = data.description;
        this.Name = data.name;
        this.Deactivation = data.deactivation ?? null;
        this.Use = data.use ?? null;

        this.ActiveActions = SerUtil.process_actions(data.active_actions);
        this.ActiveBonuses = SerUtil.process_bonuses(data.active_bonuses, data.active_name);
        this.ActiveSynergies = SerUtil.process_synergies(data.active_synergies);
        this.ActiveEffect = data.active_effect;
        this.ActiveName = data.active_name;

        this.PassiveActions = SerUtil.process_actions(data.passive_actions);
        this.PassiveBonuses = SerUtil.process_bonuses(data.passive_bonuses, data.passive_name);
        this.PassiveSynergies = SerUtil.process_synergies(data.passive_synergies);
        this.PassiveEffect = data.passive_effect;
        this.PassiveName = data.passive_name;

        this.Counters = SerUtil.process_counters(data.counters);
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables, {wait_ctx_ready: false});
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {wait_ctx_ready: false});
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
    }

    protected save_imp(): RegCoreSystemData {
        return {
            activation: this.Activation,
            description: this.Description,
            name: this.Name,
            deactivation: this.Deactivation,
            use: this.Use,

            active_actions: SerUtil.save_all(this.ActiveActions),
            active_bonuses: SerUtil.save_all(this.ActiveBonuses),
            active_synergies: SerUtil.save_all(this.ActiveSynergies),
            active_effect: this.ActiveEffect,
            active_name: this.ActiveName,

            passive_actions: SerUtil.save_all(this.PassiveActions),
            passive_bonuses: SerUtil.save_all(this.PassiveBonuses),
            passive_synergies: SerUtil.save_all(this.PassiveSynergies),
            passive_effect: this.PassiveEffect,
            passive_name: this.PassiveName,

            counters: SerUtil.save_all(this.Counters),
            deployables: SerUtil.ref_all(this.Deployables),
            integrated: SerUtil.ref_all(this.Integrated),
            tags: SerUtil.save_all(this.Tags),
        };
    }

    public static async unpack(
        data: PackedCoreSystemData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<RegCoreSystemData> {
        // Get tags
        let tags = SerUtil.unpack_tag_instances(reg, data.tags);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(data.counters);

        // Get the deployables
        let deployables_ = await Promise.all(
            (data.deployables ?? []).map(i =>
                Deployable.unpack(i, reg, ctx, "cs_" + lid_format_name(data.name))
            )
        ); // Need to generate an lid for the core system. Doesn't need to exist, just gotta be uniqueish
        let deployables = SerUtil.ref_all(deployables_) as RegRef<EntryType.DEPLOYABLE>[];

        // Get any integrated data
        let integrated = SerUtil.unpack_integrated_refs(reg, data.integrated);

        // Get and ref the deployables
        let unpacked: RegCoreSystemData = merge_defaults({
            name: data.name,
            description: data.description,
            use: data.use,

            activation: data.activation,
            deactivation: data.deactivation,

            active_effect: data.active_effect,
            active_name: data.active_name,
            active_synergies: (data.active_synergies ?? []),
            active_bonuses: (data.active_bonuses ?? []).map(Bonus.unpack),
            active_actions: (data.active_actions ?? []).map(Action.unpack),

            passive_effect: data.passive_effect,
            passive_name: data.passive_name,
            passive_synergies: (data.passive_synergies ?? []),
            passive_bonuses: (data.passive_bonuses ?? []).map(Bonus.unpack),
            passive_actions: (data.passive_actions ?? []).map(Action.unpack),

            tags,
            counters,
            deployables,
            integrated,
        }, defaults.CORE_SYSTEM());
        return unpacked;
    }

    // Checks if any passive fields are present. Its possible sibling, has_active, is unnecessary
    has_passive(): boolean {
        return !!(
            (this.PassiveActions && this.PassiveActions.length) ||
            (this.PassiveBonuses && this.PassiveBonuses.length) ||
            this.PassiveName ||
            (this.PassiveSynergies && this.PassiveSynergies.length) ||
            this.PassiveEffect
        );
    }

    // Helper to get weapons, specifically
    get IntegratedWeapons(): MechWeapon[] {
        return this.Integrated.filter(r => r instanceof MechWeapon) as MechWeapon[];
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Integrated, ...this.Deployables];
    }

    public async emit(): Promise<PackedCoreSystemData> {
        return {
            activation: this.Activation,
            active_effect: this.ActiveEffect,
            active_name: this.ActiveName,
            active_synergies: await SerUtil.emit_all(this.ActiveSynergies),
            active_actions: await SerUtil.emit_all(this.ActiveActions),
            active_bonuses: await SerUtil.emit_all(this.ActiveBonuses),
            passive_effect: this.PassiveEffect,
            passive_name: this.PassiveName,
            passive_synergies: await SerUtil.emit_all(this.PassiveSynergies),
            passive_actions: await SerUtil.emit_all(this.PassiveActions),
            passive_bonuses: await SerUtil.emit_all(this.PassiveBonuses),
            description: this.Description,
            name: this.Name,
            tags: await SerUtil.emit_all(this.Tags),
            counters: await SerUtil.emit_all(this.Counters),
            deactivation: this.Deactivation,
            deployables: await SerUtil.emit_all(this.Deployables),
            integrated: this.Integrated.map(i => (i as any).LID),
            use: this.Use
        }


    }
}
