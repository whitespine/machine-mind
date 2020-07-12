import { PilotEquipment, ItemType } from "@/class";
import { IPilotEquipmentData } from "@/interface";

interface IPilotGearData extends IPilotEquipmentData {
    uses?: number | null;
}

class PilotGear extends PilotEquipment {
    private uses: number | null;

    public constructor(gearData: IPilotGearData) {
        super(gearData);
        this.uses = gearData.uses || null;
        this._item_type = ItemType.PilotGear;
    }

    public get Uses(): number | null {
        return this.current_uses || null;
    }

    public set Uses(val: number | null) {
        val = val || 0;
        if(val < 0) {
            val = 0;
        }
        if(this.uses && val > this.uses) {
            val = this.uses;
        }
        this.current_uses = val;
        this.save();
    }

    public get MaxUses(): number | null {
        return this.uses || null;
    }
}

export { PilotGear, IPilotGearData };
