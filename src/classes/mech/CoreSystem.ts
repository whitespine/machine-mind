import { MechWeapon, Tag, ActivationType, MMItem, MixActions, MixBonuses, MixSynergies, MixDeployables, MixCounters, MixIntegrated } from "@/class";
import { ICompendiumItemData, ITagData, IActionData, IDeployableData, ICounterData, IBonusData, ISynergyData, IHasDeployables, IHasTags, IHasCounters, IHasIntegrated, IMMItemData, IHasActions, IHasBonuses, IHasSynergies } from "@/interface";
import { store } from "@/hooks";
import { CoreUseType } from '../enums';
import { MixinHost } from '../CompendiumItem';

// Note - though this extends IMMItemData, we don't expect it to have a description
export interface ICoreSystemData extends IHasDeployables, IHasCounters, IHasIntegrated, IHasTags {
  name: string,
  active_name: string,
  active_effect: string, // v-html
  activation: ActivationType,
  deactivation?: ActivationType,
  use?: CoreUseType | null;

  active_actions: IActionData[],
  active_bonuses: IBonusData[],
  active_synergies: ISynergyData[],

  passive_name?: string | null,
  passive_effect?: string | null, // v-html, 
  passive_actions?: IActionData[] | null,
}


// Used to represent passive/active states
export interface ICoreSystemPartData extends IHasActions, IHasBonuses, IHasActions {};
export class CoreSystemPart extends MixinHost<ICoreSystemPart> {
    public readonly Actions: MixActions = new MixActions();
    public readonly 
    constructor() {
        super();
        this.register_mixins
    }

    protected serialize_self() {
        return {}; // we're all mixins
    }
}


export class CoreSystem extends MMItem<ICoreSystemData> {
    private _passive: CoreSystemPart;
    private _active: CoreSystemPart;
}

export class CoreSystemPart extends MMItem<ICoreSystemPart> {
    // Mixins. 
    public readonly Actions: MixActions;
    public readonly Bonuses: MixBonuses;
    public readonly Synergies: MixSynergies;

    public readonly Deployables: MixDeployables ;
    public readonly Counters: MixCounters ;
    public readonly Integrated: MixIntegrated ;

    private _use: UseType | null; 
    public get Use(): UseType | null { return this._use ;}
    public set Use(nv: UseType | null) { this._use = nv ;}

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


export class CoreSystem extends MMItem<ICoreSystemData> {
    private _integrated: string | null;
    private _passive_name: string | null;
    private _passive_effect: string | null;
    private _active_name: string;
    private _active_effect: string;
    private _use: CoreUseType | null;

    public constructor(coreData: ICoreSystemData) {
        super(coreData);
        this._name = coreData.name;
        this._description = coreData.description;
        this._integrated = coreData.integrated ? coreData.integrated.id : null;
        this._passive_name = coreData.passive_name || null;
        this._passive_effect = coreData.passive_effect || null;
        this._active_name = coreData.active_name;
        this._active_effect = coreData.active_effect;
        this._tags = coreData.tags;
    }

    public get Name(): string {
        return this._name;
    }

    public get Description(): string {
        return this._description;
    }

    public get Integrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.getReferenceByID("MechWeapons", this._integrated);
    }

    public getIntegrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.instantiate("MechWeapons", this._integrated);
    }

    public get PassiveName(): string | null {
        return this._passive_name || null;
    }

    public get PassiveEffect(): string | null {
        return this._passive_effect || null;
    }

    public get ActiveName(): string {
        return this._active_name;
    }

    public get ActiveEffect(): string {
        return this._active_effect;
    }

    public get Tags(): Tag[] {
        return Tag.Deserialize(this._tags);
    }
}
