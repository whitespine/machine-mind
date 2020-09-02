import { CompendiumItem, ItemType, Manufacturer, EquippableMount } from "@/class";
import { store } from "@/hooks";

import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ICompendiumItemData } from "@/interface";
import { IHasActions, IHasBonuses, IHasSynergies, IHasDeployables, IHasCounters, IHasIntegrated, MixActions, MixBonuses, MixSynergies, MixDeployables, MixCounters, MixIntegrated } from '../CompendiumItem';

export interface ICoreBonusData extends ICompendiumItemData, IHasActions, IHasBonuses, IHasSynergies, IHasDeployables, IHasCounters, IHasIntegrated {
  source: string, // must be the same as the Manufacturer ID to sort correctly
  effect: string, // v-html
  mounted_effect?: string | null
}
export class CoreBonus extends CompendiumItem<ICoreBonusData> {
    // Mixins
    public readonly Actions: MixActions;
    public readonly Bonuses: MixBonuses;
    public readonly Synergies: MixSynergies ;
    public readonly Deployables: MixDeployables ;
    public readonly Counters: MixCounters ;
    public readonly Integrated: MixIntegrated ;

    private _source: string; 
    public get Source(): string { return this._source ;}
    public set Source(nv: string) { this._source = nv ;}

    private _effect: string; 
    public get Effect(): string { return this._effect ;}
    public set Effect(nv: string) { this._effect = nv ;}


    private _mounted_effect: string | null;
    public get MountedEffect(): string | null { return this._mounted_effect; }
    public set MountedEffect(nv: string | null) { this._mounted_effect = nv; }

    public constructor(cbData: ICoreBonusData) {
        super(ItemType.CoreBonus, cbData);

        // Handle mixins
        let mixins = [
            this.Actions = new MixActions(),
            this.Bonuses = new MixBonuses(),
            this.Synergies = new MixSynergies(),
            this.Deployables = new MixDeployables(),
            this.Counters = new MixCounters(),
            this.Integrated = new MixIntegrated()
        ];
        this.register_mixins(mixins);
        this.load(cbData);

        // Handle specific data
        this._source = cbData.source;
        this._effect = cbData.effect;
        this._mounted_effect = cbData.mounted_effect || null;
    }
}
