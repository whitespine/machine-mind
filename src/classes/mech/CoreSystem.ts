import { Action, ActivationType, Bonus, Counter, Deployable, Synergy, TagInstance} from "@/class";
import { ITagInstanceData, IActionData, IDeployableData, ICounterData, IBonusData, ISynergyData} from "@/interface";
import { ActionsMixReader, ActionsMixWriter, BonusesMixReader, BonusesMixWriter, CountersMixReader, CountersMixWriter, DeployableMixReader, DeployableMixWriter, ident, ident_drop_null, MixBuilder, RWMix, MixLinks, SynergyMixReader, SynergyMixWriter, TagInstanceMixReader, TagInstanceMixWriter } from '@/mixmeta';
import { FrameEffectUse } from '../enums';

export interface ICoreSystemData {
  "name": string,
  "description": string, // v-html
  "active_name": string,
  "active_effect": string, // v-html
  "activation": ActivationType,
  "deactivation"?: ActivationType,
  "use"?: FrameEffectUse;
  "active_actions": IActionData[],
  "active_bonuses": IBonusData[],
  "active_synergies": ISynergyData[],
  
  // Basically the same but passives
  "passive_name"?: string,
  "passive_effect"?: string, // v-html, 
  "passive_actions"?: IActionData[],
  "passive_bonuses"?: IBonusData[],
  "passive_synergies"?: ISynergyData[],

  // And all the rest
  "deployables"?: IDeployableData[],
  "counters"?: ICounterData[],
  "integrated"?: string[]
  "tags": ITagInstanceData[]
}

export interface CoreSystem extends MixLinks<ICoreSystemData> {
    Name: string;
    Description: string;

    Activation: ActivationType;
    Deactivation: ActivationType | null;
    Use: FrameEffectUse | null;

    ActiveName: string;
    ActiveEffect: string;
    ActiveActions: Action[];
    ActiveBonuses: Bonus[];
    ActiveSynergies: Synergy[];

    PassiveName: string | null;
    PassiveEffect: string | null;
    PassiveActions: Action[] | null;
    PassiveBonuses: Bonus[] | null;
    PassiveSynergies: Synergy[] | null;

    Deployables: Deployable[];
    Counters: Counter[];
    Integrated: string[];
    Tags: TagInstance[];

    // Methods
    has_passive(): boolean; // Checks for the non-nullity of any passive fields
}

export function CreateCoreSystem(data: ICoreSystemData | null): CoreSystem {
    let mb = new MixBuilder<CoreSystem, ICoreSystemData>({
        has_passive
    });
    mb.with(new RWMix("Name", "name", "New Core System", ident, ident));
    mb.with(new RWMix("Description", "description", "No description", ident, ident));
    mb.with(new RWMix("Use", "use", null, ident, ident_drop_null));

    mb.with(new RWMix("PassiveName", "passive_name", null, ident, ident_drop_null));
    mb.with(new RWMix("PassiveEffect", "passive_effect", null, ident, ident_drop_null));
    mb.with(new RWMix("PassiveActions", "passive_actions", null, ActionsMixReader, nundefmaparr(ActionsMixWriter)));
    mb.with(new RWMix("PassiveBonuses", "passive_bonuses", null, BonusesMixReader, nundefmaparr(BonusesMixWriter)));
    mb.with(new RWMix("PassiveSynergies", "passive_synergies", null, SynergyMixReader, nundefmaparr(SynergyMixWriter)));

    mb.with(new RWMix("ActiveName", "active_name", "Core Active", ident, ident));
    mb.with(new RWMix("ActiveEffect", "active_effect", "No effect", ident, ident));
    mb.with(new RWMix("ActiveActions", "active_actions", [], ActionsMixReader, ActionsMixWriter));
    mb.with(new RWMix("ActiveBonuses", "active_bonuses", [], BonusesMixReader, BonusesMixWriter));
    mb.with(new RWMix("ActiveSynergies", "active_synergies", [], SynergyMixReader, SynergyMixWriter));

    mb.with(new RWMix("Deployables", "deployables", [], DeployableMixReader, DeployableMixWriter));
    mb.with(new RWMix("Counters", "counters", [], CountersMixReader, CountersMixWriter));
    mb.with(new RWMix("Integrated", "integrated", [], ident, ident ));
    mb.with(new RWMix("Tags", "tags", [], TagInstanceMixReader, TagInstanceMixWriter ));

    return mb.finalize(data);
}

function has_passive(this: CoreSystem) {
    return !!(this.PassiveActions || this.PassiveBonuses || this.PassiveName || this.PassiveSynergies || this.PassiveEffect);
}


/*
    public get Integrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.getReferenceByID("MechWeapons", this._integrated);
    }

    public getIntegrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.instantiate("MechWeapons", this._integrated);
    }
*/


// Simple lambda wrapper to handle our could-be-array-could-be-null
function nundefmaparr<I, O>(converter: (v: I[]) => O[]): (v: I[] | null) => O[] | undefined {
    return (v: I[] | null) => {
        if(v) {
            return converter(v);
        }else {
            return undefined;
        };
}
