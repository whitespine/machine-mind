import { IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ICompendiumItemData, IHasActions, IHasBonuses, IHasSynergies, IHasDeployables, IHasCounters, IHasIntegrated, IMMItemData } from '@/interface';
import { ItemType, TraitUseType } from '../enums';
import { MixActions, MixBonuses, MixSynergies, MixDeployables, MixCounters, MixIntegrated, MMItem } from '@/class';



export interface IFrameTraitData extends IMMItemData, IHasActions, IHasBonuses, IHasSynergies, IHasDeployables, IHasCounters, IHasIntegrated {
    // All else is contained in above
  use?: TraitUseType;
}


export class FrameTrait extends MMItem<IFrameTraitData> {
    // Mixins
    public readonly Actions: MixActions;
    public readonly Bonuses: MixBonuses;
    public readonly Synergies: MixSynergies ;
    public readonly Deployables: MixDeployables ;
    public readonly Counters: MixCounters ;
    public readonly Integrated: MixIntegrated ;

    private _use: TraitUseType | null; 
    public get Use(): TraitUseType | null { return this._use ;}
    public set Use(nv: TraitUseType | null) { this._use = nv ;}

    public constructor(ftd: IFrameTraitData) {
        super(ftd);

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
        this.load(ftd);

        // Handle specific data
        this._use = ftd.use || null;
    }

    protected serialize_self() {
        return {
            ...super.serialize_self(),
            use: this._use
        };
    }
}

