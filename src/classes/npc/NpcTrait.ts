import { INpcFeatureData } from "./interfaces";
import { NpcFeature, NpcFeatureType } from '@/class';

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
