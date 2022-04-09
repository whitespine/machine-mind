import { defaults } from "@src/funcs";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
} from "@src/registry";
import { merge_defaults } from "../default_entries";

interface AllTagTemplateData {
    name: string;
    description: string;
    filter_ignore?: boolean;
    hidden?: boolean;
}

export interface PackedTagTemplateData extends AllTagTemplateData {
    id: string;
}
export interface RegTagTemplateData extends Required<AllTagTemplateData> {
    lid: string;
}

export interface PackedTagInstanceData {
    id: string;
    val?: string | number;
}

export interface RegTagInstanceData {
    tag: RegRef<EntryType.TAG>;
    val?: string | number;
}

// TODO: I decided how to do these very early on, while still holding closely to compcons patterns. It should maybe be different (perhaps a single object)
export class TagTemplate extends RegEntry<EntryType.TAG> {
    LID!: string;
    Name!: string;
    Description!: string;
    Hidden!: boolean;
    FilterIgnore!: boolean; // Whether to ignore this tags data when filtering

    public async load(data: RegTagTemplateData): Promise<void> {
        merge_defaults(data, defaults.TAG_TEMPLATE());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Hidden = data.hidden || false; // Whether to show this tag
        this.FilterIgnore = data.filter_ignore;
    }

    protected save_imp(): RegTagTemplateData {
        return {
            lid: this.LID,
            name: this.Name,
            description: this.Description,
            filter_ignore: this.FilterIgnore,
            hidden: this.Hidden,
        };
    }
    public static async unpack(
        dep: PackedTagTemplateData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<TagTemplate> {
        return reg.get_cat(EntryType.TAG).create_live(ctx, {
            lid: dep.id,
            description: dep.description,
            name: dep.name,
            filter_ignore: dep.filter_ignore ?? false,
            hidden: dep.hidden ?? false,
        });
    }

    get ShouldShow(): boolean {
        return this.FilterIgnore || this.Hidden;
    }
    get IsUnique(): boolean {
        return this.LID === "tg_unique";
    }
    get IsAI(): boolean {
        return this.LID === "tg_ai";
    }
    get IsAP(): boolean {
        return this.LID === "tg_ap";
    }
    get IsLimited(): boolean {
        return this.LID === "tg_limited";
    }
    get IsLoading(): boolean {
        return this.LID === "tg_loading";
    }
    get IsRecharge(): boolean {
        return this.LID === "tg_recharge";
    }
    get IsIndestructible(): boolean {
        return this.LID === "tg_indestructible";
    }
    get IsSmart(): boolean {
        return this.LID === "tg_smart";
    }
    get IsSeeking(): boolean {
        return this.LID === "tg_seeking";
    }
    get IsOverkill(): boolean {
        return this.LID === "tg_overkill";
    }
    get IsAccurate(): boolean {
        return this.LID === "tg_accurate";
    }
    get IsInaccurate(): boolean {
        return this.LID === "tg_inaccurate";
    }
    get IsReliable(): boolean {
        return this.LID === "tg_reliable";
    }
    get IsSelfHeat(): boolean {
        return this.LID === "tg_heat_self";
    }
    get IsKnockback(): boolean {
        return this.LID === "tg_knockback";
    }
    get IsOvershield(): boolean {
        return this.LID === "tg_overshield";
    }
    get IsCascadeResistant(): boolean {
        return this.LID === "tg_no_cascade";
    }
    get IsOrdnance(): boolean {
        return this.LID === "tg_ordnance";
    }

    public async emit(): Promise<PackedTagTemplateData> {
        return {
            id: this.LID,
            name: this.Name,
            description: this.Description,
            filter_ignore: this.FilterIgnore,
            hidden: this.Hidden,
        };
    }

    // Create an instance of this tag
    public instance(val?: string | number | null): TagInstance {
        return new TagInstance(this, val);
    }
}

export class TagInstance extends RegSer<RegTagInstanceData> {
    Tag!: TagTemplate;
    Value!: string | number | null;

    constructor(reg: Registry, ctx: OpCtx, dat: RegTagInstanceData);
    constructor(tag: TagTemplate, val?: string | number | null);
    constructor(reg_or_tag: Registry | TagTemplate, ctx_or_val: OpCtx | string | number | null | undefined, dat?: RegTagInstanceData) {
        // Making an instance of a pre-fetched TagTemplate
        if(reg_or_tag instanceof TagTemplate) {
            super(reg_or_tag.Registry, reg_or_tag.OpCtx, "override", reg_or_tag.load_done());
            this.Tag = reg_or_tag;
            this.Value = (ctx_or_val instanceof OpCtx) ? null : (ctx_or_val ?? null); // Dodge some weird potential edge cases
        } else {
            super(reg_or_tag, ctx_or_val as OpCtx, dat!)
        }
    }

    public as_number(default_num: number = 0): number {
        let parsed = Number.parseInt(`${this.Value}`);
        if (Number.isNaN(parsed)) {
            return default_num;
        } else {
            return parsed;
        }
    }

    public async load(data: RegTagInstanceData): Promise<void> {
        this.Value = data.val ?? null;
        let Tag = await this.Registry.resolve(this.OpCtx, data.tag, { wait_ctx_ready: false });
        if (!Tag) {
            Tag = new TagTemplate(EntryType.TAG, this.Registry, this.OpCtx, "error", {
                description: "INVALID",
                lid: data.tag.fallback_lid,
                name: data.tag.fallback_lid,
                filter_ignore: true,
                hidden: false, // Want it to be seen so it can be fixed
            });
            await Tag.load_done();
        }
        this.Tag = Tag;
    }

    protected save_imp(): RegTagInstanceData {
        return {
            val: this.Value ?? undefined,
            tag: this.Tag.as_ref(),
        };
    }

    // Unpacks this tag instance, forming a proper reg ref instead of the old shoddy id lookup based thing
    // we don't instantiate to avoid a farily common race condition
    public static unpack_reg(reg: Registry, inst: PackedTagInstanceData): RegTagInstanceData {
        // Just create an unresolved ref
        let dat: RegTagInstanceData = {
            tag: quick_local_ref(reg, EntryType.TAG, inst.id),
            val: inst.val,
        };
        return dat;
    }

    public async emit(): Promise<PackedTagInstanceData> {
        return {
            id: this.Tag.LID,
            val: this.Value ?? undefined,
        };
    }

    // Sync duplicate
    public dup(): TagInstance {
        return new TagInstance(this.Tag, this.Value);
    }
}
