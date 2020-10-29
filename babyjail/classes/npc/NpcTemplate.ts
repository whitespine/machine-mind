import { store } from "@/hooks";
import { NpcFeature } from "@/class";
import { EntryType, RegRef } from '@/new_meta';

interface AllNpcTemplateData {
    name: string;
    description: string;
    power: number;
}

export interface PackedNpcTemplateData extends AllNpcTemplateData {
    base_features: string[];
    optional_features: string[];
}

export interface RegNpcTemplateData extends AllNpcTemplateData {
    base_features: RegRef<EntryType.NPC_FEATURE>[];
    optional_features: RegRef<EntryType.NPC_FEATURE>[];
}

export class NpcTemplate {
    Id: string;
    Name: string;
    Description: string;
    BaseFeatures: NpcFeature[];
    OptionalFeatures: NpcFeature[];
    Power: number;
}