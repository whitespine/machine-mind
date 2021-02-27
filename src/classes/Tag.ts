import { defaults } from "@src/funcs";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    RegSer,
    SimSer,
} from "@src/registry";

export interface ITagTemplateData {
    id: string;
    name: string;
    description: string;
    filter_ignore?: boolean;
    hidden?: boolean;
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
    ID!: string;
    Name!: string;
    Description!: string;
    Hidden!: boolean;
    _filter_ignore!: boolean | null; // Whether to ignore this tags data when filtering

    public async load(data: ITagTemplateData): Promise<void> {
        data = { ...defaults.TAG_TEMPLATE(), ...data };
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.Hidden = data.hidden || false; // Whether to show this tag
        this._filter_ignore = data.filter_ignore || null;
    }

    protected save_imp(): ITagTemplateData {
        return {
            id: this.ID,
            name: this.Name,
            description: this.Description,
            filter_ignore: this._filter_ignore || undefined,
            hidden: this.Hidden,
        };
    }
    public static async unpack(
        dep: ITagTemplateData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<TagTemplate> {
        return reg.get_cat(EntryType.TAG).create_live(ctx, dep);
    }

    get FilterIgnore(): boolean {
        return this._filter_ignore || this.Hidden;
    }
    get IsUnique(): boolean {
        return this.ID === "tg_unique";
    }
    get IsAI(): boolean {
        return this.ID === "tg_ai";
    }
    get IsLimited(): boolean {
        return this.ID === "tg_limited";
    }
    get IsLoading(): boolean {
        return this.ID === "tg_loading";
    }
    get IsRecharging(): boolean {
        return this.ID === "tg_recharge";
    }
    get IsIndestructible(): boolean {
        return this.ID === "tg_indestructible";
    }
    get IsSmart(): boolean {
        return this.ID === "tg_smart";
    }
    get IsOverkill(): boolean {
        return this.ID === "tg_overkill";
    }
}

export class TagInstance extends RegSer<RegTagInstanceData> {
    Tag!: TagTemplate;
    Value!: string | number | null;

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
        let Tag = await this.Registry.resolve(this.OpCtx, data.tag);
        if (!Tag) {
            Tag = new TagTemplate(EntryType.TAG, this.Registry, this.OpCtx, "error", {
                description: "INVALID",
                id: data.tag.fallback_mmid,
                name: data.tag.fallback_mmid,
                filter_ignore: true,
                hidden: false, // Want it to be seen so it can be fixed
            });
            await Tag.ready();
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
}
