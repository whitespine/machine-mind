import { PilotEquipment, ItemType,} from "@/class";
import { IPilotEquipmentData, ITagged } from "@/interface";
import { CompendiumItem, IHasDeployables, IHasActions, IHasBonuses } from '../CompendiumItem';

export interface IPilotArmorData extends IHasDeployables, IHasActions, IHasBonuses, IHas {
  id: string,
  name: string, // v-html
  type: "Armor",
  description: string,
  // Tags, deplys, etc only valid when unmounted
}

export class PilotArmor extends CompendiumItem {
    public readonly Tags: MixTagged;
    private readonly Mod: MixModifies;
    private deploys: MixDeploys;

    public constructor(data: IPilotArmorData) {
        this.name = data.name;
        this.tags = new MixTagged(data);
        this.mods = new MixModifies(data);
        this.deploys = new MixDeploys(data);
        // this._item_type = ItemType.PilotArmor;
    }
}
