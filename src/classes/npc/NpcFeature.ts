import { TagInstance } from "@src/class";
import { NpcFeatureType } from "@src/enums";
import { PackedTagInstanceData, RegTagInstanceData } from "@src/interface";
import { EntryType, RegEntry, SerUtil } from "@src/registry";

// Tracks where the feature comes from
interface IOriginData {
    type: "Class" | "Template";
    name: string; // The class or template it is from
    base: boolean; // Whether it is a base feature of that class or template
}

interface AllNpcFeatureData {
    id: string;
    name: string;
    origin: IOriginData;
    effect?: string;
    bonus?: object;
    override?: object;
    type: NpcFeatureType;
}

export interface PackedNpcFeatureData extends AllNpcFeatureData {
    tags: PackedTagInstanceData[];
    locked: boolean; // If it can be removed, maybe?
    hide_active: boolean; // ???????
}

export interface RegNpcFeatureData extends AllNpcFeatureData {
    tags: RegTagInstanceData[];
}

export class NpcFeature extends RegEntry<EntryType.NPC_FEATURE> {
    public ID!: string;
    public Name!: string;
    public Origin!: IOriginData;
    public Effect!: string;
    public Bonus!: object;
    public Override!: object;
    public Locked!: boolean;
    public Tags!: TagInstance[];
    public FeatureType!: NpcFeatureType;

    public get FormattedEffect(): string {
        if (!this.Effect) return "";
        const perTier = /(\{.*?\})/;
        const m = this.Effect.match(perTier);
        if (m) {
            return this.Effect.replace(
                perTier,
                m[0].replace("{", '<b class="accent--text">').replace("}", "</b>")
            );
        }
        return this.Effect;
    }

    public FormattedEffectByTier(tier: number): string {
        if (!this.Effect) return "";
        let fmt = this.Effect;
        const perTier = /(\{.*?\})/g;
        const m = this.Effect.match(perTier);
        if (m) {
            m.forEach(x => {
                const tArr = x
                    .replace("{", "")
                    .replace("}", "")
                    .split("/");
                fmt = fmt.replace(x, `<b class="accent--text">${tArr[tier - 1]}</b>`);
            });
        }
        return fmt;
    }

    protected async load(data: RegNpcFeatureData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Origin = data.origin;
        this.Effect = data.effect || "";
        this.Bonus = data.bonus || {};
        this.Override = data.override || {};
        // this.Locked = data.locked || false;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        // this.Hide_active = data.hide_active || false;
        this.FeatureType = data.type;
    }

    public async save(): Promise<RegNpcFeatureData> {
        return {
            id: this.ID,
            name: this.Name,
            origin: this.Origin,
            effect: this.Effect,
            bonus: this.Bonus,
            override: this.Override,
            tags: await SerUtil.save_all(this.Tags),
            type: this.FeatureType,
        };
    }
}
