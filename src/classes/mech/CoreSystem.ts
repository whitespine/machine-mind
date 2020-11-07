import { Action, Bonus, Counter, Deployable, MechWeapon, Synergy, TagInstance } from "@/class";
import {
    IActionData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegTagInstanceData,
    IBonusData,
} from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@/registry";
import { ActivationType, FrameEffectUse } from "../enums";

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
    active_bonuses: IBonusData[];
    passive_bonuses?: IBonusData[];
}

export interface RegCoreSystemData extends Required<AllCoreSystemData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    tags: RegTagInstanceData[];
    active_bonuses: IBonusData[];
    passive_bonuses?: IBonusData[];
}

export class CoreSystem extends RegEntry<EntryType.CORE_SYSTEM, RegCoreSystemData> {
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
    PassiveBonuses!: Bonus[] ;
    PassiveSynergies!: Synergy[] ;

    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];
    Tags!: TagInstance[];

    protected async load(data: RegCoreSystemData): Promise<void> {
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
        this.Deployables = await this.Registry.resolve_many(data.deployables);
        this.Integrated = await this.Registry.resolve_many(data.integrated);
        this.Tags = await SerUtil.process_tags(this.Registry, data.tags);
    }

    public async save(): Promise<RegCoreSystemData> {
        return {
            activation: this.Activation,
            description: this.Description,
            name: this.Name,
            deactivation: this.Deactivation,
            use: this.Use,

            active_actions: SerUtil.sync_save_all(this.ActiveActions),
            active_bonuses: SerUtil.sync_save_all(this.ActiveBonuses),
            active_synergies: SerUtil.sync_save_all(this.ActiveSynergies),
            active_effect: this.ActiveEffect,
            active_name: this.ActiveName,

            passive_actions: SerUtil.sync_save_all(this.PassiveActions),
            passive_bonuses: SerUtil.sync_save_all(this.PassiveBonuses),
            passive_synergies: SerUtil.sync_save_all(this.PassiveSynergies),
            passive_effect: this.PassiveEffect ?? undefined,
            passive_name: this.PassiveName ?? undefined,

            counters: SerUtil.sync_save_all(this.Counters),
            deployables: SerUtil.ref_all(this.Deployables),
            integrated: SerUtil.ref_all(this.Integrated),
            tags: await SerUtil.save_all(this.Tags),
        };
    }

    public static async unpack(dep: PackedCoreSystemData, reg: Registry): Promise<CoreSystem> {
        SerUtil.unpack_children(TagInstance.unpack, reg, dep.tags);
        // Get the tags
        let tags = await SerUtil.unpack_children(TagInstance.unpack, reg, dep.tags);
        let reg_tags = await SerUtil.save_all(tags); // A bit silly, but tags don't actually make entries for us to refer to or whatever, so we need to save them back

        // Get the counters
        let counters = SerUtil.unpack_counters_default(dep.counters);

        // Get the deployables
        let deployables_ = await SerUtil.unpack_children(Deployable.unpack, reg, dep.deployables);
        let deployables = SerUtil.ref_all(deployables_) as RegRef<EntryType.DEPLOYABLE>[];

        // Get any integrated data
        let integrated = SerUtil.unpack_integrated_refs(dep.integrated);

        // Get and ref the deployables
        let unpacked: RegCoreSystemData = {
            counters,
            tags: reg_tags,
            deployables,
            integrated,
            activation: dep.activation || ActivationType.None,
            deactivation: dep.deactivation || ActivationType.None,
            active_actions: dep.active_actions,
            active_bonuses: dep.active_bonuses,
            active_effect: dep.active_effect,
            active_name: dep.active_name,
            active_synergies: dep.active_synergies,
            description: dep.description,
            name: dep.name,
            passive_actions: dep.passive_actions ?? [],
            passive_bonuses: dep.passive_bonuses ?? [],
            passive_synergies: dep.passive_synergies ?? [],
            passive_effect: dep.passive_effect ?? "",
            passive_name: dep.passive_name ?? "",
            use: dep.use ?? FrameEffectUse.Unknown,
        };
        return reg.get_cat(EntryType.CORE_SYSTEM).create(unpacked);
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
        return this.Integrated.filter(r => r.Type == EntryType.MECH_WEAPON) as MechWeapon[];
    }
}
