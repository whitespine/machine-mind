import { Action, Bonus, Counter, Deployable, MechWeapon, Synergy, TagInstance } from "@/class";
import {
    ITagInstanceData,
    IActionData,
    IDeployableData,
    IBonusData,
    ISynergyData,
    PackedCounterData,
    RegCounterData,
} from "@/interface";
import { EntryType, RegEntry, RegRef } from "@/new_meta";
import { ActivationType, FrameEffectUse } from "../enums";
import { RegTagInstanceData } from "../Tag";

export interface AllCoreSystemData {
    name: string;
    description: string; // v-html
    active_name: string;
    active_effect: string; // v-html
    activation: ActivationType;
    deactivation?: ActivationType;
    use?: FrameEffectUse;
    active_actions: IActionData[];
    active_bonuses: IBonusData[];
    active_synergies: ISynergyData[];

    // Basically the same but passives
    passive_name?: string;
    passive_effect?: string; // v-html,
    passive_actions?: IActionData[];
    passive_bonuses?: IBonusData[];
    passive_synergies?: ISynergyData[];

    // And all the rest
}

export interface PackedCoreSystemData extends AllCoreSystemData {
    deployables?: IDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    tags: ITagInstanceData[];
}

export interface RegCoreSystemData extends AllCoreSystemData {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    tags: RegTagInstanceData[];
}

export class CoreSystem extends RegEntry<EntryType.CORE_SYSTEM, RegCoreSystemData> {
    Name!: string;
    Description!: string;

    Activation!: ActivationType;
    Deactivation!: ActivationType | null;
    Use!: FrameEffectUse | null;

    ActiveName!: string;
    ActiveEffect!: string;
    ActiveActions!: Action[];
    ActiveBonuses!: Bonus[];
    ActiveSynergies!: Synergy[];

    PassiveName!: string | null;
    PassiveEffect!: string | null;
    PassiveActions!: Action[] | null;
    PassiveBonuses!: Bonus[] | null;
    PassiveSynergies!: Synergy[] | null;

    Deployables!: Deployable[];
    Counters!: Counter[];
    Integrated!: RegEntry<any, any>[];
    Tags!: TagInstance[];

    protected load(data: RegCoreSystemData): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async save(): Promise<RegCoreSystemData> {
        return {
            activation: this.Activation,
            description: this.Description,
            name: this.Name,
            deactivation: this.Deactivation ?? undefined,
            use: this.Use ?? undefined,

            active_actions: this.ActiveActions.map(a => a.save()),
            active_bonuses: this.ActiveBonuses.map(b => b.save()),
            active_synergies: this.ActiveSynergies.map(a => a.save()),
            active_effect: this.ActiveEffect,
            active_name: this.ActiveName,

            passive_actions: this.PassiveActions?.map(a => a.save()) ?? undefined,
            passive_bonuses: this.PassiveBonuses?.map(b => b.save()) ?? undefined,
            passive_synergies: this.PassiveSynergies?.map(a => a.save()) ?? undefined,
            passive_effect: this.PassiveEffect ?? undefined,
            passive_name: this.PassiveName ?? undefined,

            counters: this.Counters.map(c => c.save()),
            deployables: this.Deployables.map(d => d.as_ref()),
            integrated: this.Integrated.map(r => r.as_ref()),
            tags: await Promise.all(this.Tags.map(t => t.save()))
        };
    }

    // Checks if any passive fields are present. Its possible sibling, has_active, is unnecessary
    has_passive(): boolean {
        return !!(
            this.PassiveActions ||
            this.PassiveBonuses ||
            this.PassiveName ||
            this.PassiveSynergies ||
            this.PassiveEffect
        );
    }

    // Helper to get weapons, specifically
    get IntegratedWeapons(): MechWeapon[] {
        return this.Integrated.filter(r => r.Type == EntryType.MECH_WEAPON) as MechWeapon[];
    }
}
