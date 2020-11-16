import { INpcFeatureData } from "@src/interface";
import { NpcFeature, NpcFeatureType } from "@src/class";

export class NpcTrait extends NpcFeature {
    public constructor(data: INpcFeatureData) {
        super(data);
        this.type = NpcFeatureType.Trait;
    }

    public get Color(): string {
        return "npc--trait";
    }

    public get Icon(): string {
        return "cci-trait";
    }
}
