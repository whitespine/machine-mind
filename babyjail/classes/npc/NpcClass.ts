import { INpcClassStats, NpcClassStats } from "./NpcClassStats";
import { store } from "@/hooks";
import { NpcFeature } from "@/class";
import { EntryType, RegEntry, RegRef } from '@/new_meta';
import { CORE_BREW_ID, USER_BREW_ID } from '../enums';

interface AllNpcClassData {
    id: string;
    name: string;
    role: string;
    info: { flavor: string; tactics: string };
    stats: INpcClassStats;
    power: number;
}
export interface PackedNpcClassData extends AllNpcClassData {
    base_features: string[];
    optional_features: string[];
}

export interface RegNpcClassData extends AllNpcClassData {
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
}

export class NpcClass extends RegEntry<EntryType.NPC_CLASS, RegNpcClassData> {
    Id!: string;
    Name!: string;
    Role!: string;
    Info!: {
        flavor: string;
        tactics: string;
    };
    Stats!: NpcClassStats;
    BaseFeatures!: NpcFeature[];
    OptionalFeatures!: NpcFeature[];
    Power!: number;
    Brew!: string;

    public async load(data: RegNpcClassData): Promise<void> {
        this.Id = data.id;
        this.Name = data.name;
        this.Role = data.role;
        this.Info = data.info;
        this.Stats = new NpcClassStats(data.stats);
        this.Power = data.power;
        this.BaseFeatures = await this.Registry.resolve_many(data.base_features);
        this.OptionalFeatures = await this.Registry.resolve_many(data.optional_features);
    }

    public async save(): Promise<RegNpcClassData> {
        return {
            base_features: this.BaseFeatures.map(b => b.as_ref()),




        }
    }


    public get RoleIcon(): string {
        if (this.Role.toLowerCase() === "biological") return "mdi-heart-pulse";
        return `cci-role-${this.Role}`;
    }

    public get Color(): string {
        return `role--${this.Role}`;
    }
}
