import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, RegSer, SimSer } from "@src/registry";

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
    _filter_ignore!: boolean | null; // Whether to ignore this tags data when filtering
    _hidden!: boolean | null;

    public async load(data: ITagTemplateData): Promise<void> {
        data = { ...defaults.TAG_TEMPLATE(), ...data };
        this.ID = data.id;
        this.Name = data.id;
        this.Description = data.description;
        this._filter_ignore = data.filter_ignore || null;
        this._hidden = data.hidden || null; // Whether to show this tag
    }

    public save(): ITagTemplateData {
        return {
            id: this.ID,
            name: this.Name,
            description: this.Description,
            filter_ignore: this._filter_ignore || undefined,
            hidden: this._hidden || undefined,
        };
    }
    public static async unpack(
        dep: ITagTemplateData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<TagTemplate> {
        return reg.get_cat(EntryType.TAG).create_live(ctx, dep);
    }

    // Helpers for quickly checking common tags
    get IsHidden(): boolean {
        return this._hidden || false;
    }
    get FilterIgnore(): boolean {
        return this._filter_ignore || this.IsHidden;
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
}

export class TagInstance extends RegSer<RegTagInstanceData> {
    Tag!: TagTemplate;
    Value!: string | number | null;

    public async load(data: RegTagInstanceData): Promise<void> {
        this.Value = data.val ?? null;
        let Tag = await this.Registry.resolve(this.OpCtx, data.tag);
        if (!Tag) {
            Tag = new TagTemplate(EntryType.TAG, this.Registry, this.OpCtx, "error", {
                description: "INVALID",
                id: "INVALID",
                name: "INVALID",
                filter_ignore: true,
                hidden: false, // Want it to be seen so it can be fixed
            });
            await Tag.ready();
        }
        this.Tag = Tag;
    }

    public save(): RegTagInstanceData {
        return {
            val: this.Value ?? undefined,
            tag: this.Tag.as_ref(),
        };
    }

    // Unpacks this tag instance, forming a proper reg ref instead of the old shoddy id lookup based thing
    // we don't instantiate to avoid a farily common race condition
    public static unpack_reg(inst: PackedTagInstanceData): RegTagInstanceData {
        // Just create an unresolved ref
        let dat: RegTagInstanceData = {
            tag: {
                id: inst.id,
                type: EntryType.TAG,
                is_unresolved_mmid: true,
            },
            val: inst.val,
        };
        return dat;
    }
}
