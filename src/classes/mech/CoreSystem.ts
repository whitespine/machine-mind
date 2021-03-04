import { Action, Bonus, Counter, Deployable, MechWeapon, Synergy, TagInstance } from "@src/class";
import { defaults } from "@src/funcs";
import {
    IActionData,
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

export interface AllCoreSystemData {
    name: string;
    description: string; // v-html
    activation: ActivationType;
    deactivation?: ActivationType;
    use?: FrameEffectUse;

    //
    active_name: string;
    active_effect: string; // v-html
    active_actions: IActionData[];
    active_synergies: ISynergyData[];

    // Basically the same but passives
    passive_name?: string;
    passive_effect?: string; // v-html,
    passive_actions?: IActionData[];
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
}

export interface RegCoreSystemData extends Required<AllCoreSystemData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    tags: RegTagInstanceData[];
    active_bonuses: RegBonusData[];
    passive_bonuses: RegBonusData[];
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
        data = { ...defaults.CORE_SYSTEM(), ...data };
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
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables);
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated);
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
        let deployables_ = await SerUtil.unpack_children(
            Deployable.unpack,
            reg,
            ctx,
            data.deployables
        );
        let deployables = SerUtil.ref_all(deployables_) as RegRef<EntryType.DEPLOYABLE>[];

        // Get any integrated data
        let integrated = SerUtil.unpack_integrated_refs(reg, data.integrated);

        // Get and ref the deployables
        let unpacked: RegCoreSystemData = {
            ...defaults.CORE_SYSTEM(),
            ...data,
            active_bonuses: (data.active_bonuses ?? []).map(Bonus.unpack),
            passive_bonuses: (data.passive_bonuses ?? []).map(Bonus.unpack),
            tags,
            counters,
            deployables,
            integrated,
        };
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
}
