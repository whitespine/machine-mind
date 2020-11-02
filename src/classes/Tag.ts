import { EntryType, RegEntry, Registry, RegRef, RegSer, SimSer } from "@/registry";

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

export class TagTemplate extends RegEntry<EntryType.TAG, ITagTemplateData> {
    ID!: string;
    Name!: string;
    Description!: string;
    _filter_ignore!: boolean | null; // Whether to ignore this tags data when filtering
    _hidden!: boolean | null;

    protected async load(data: ITagTemplateData): Promise<void> {
        this.ID = data.id;
        this.Name = data.id;
        this.Description = data.description;
        this._filter_ignore = data.filter_ignore || null;
        this._hidden = data.hidden || null; // Whether to show this tag
    }

    public async save(): Promise<ITagTemplateData> {
        return {
            id: this.ID,
            name: this.Name,
            description: this.Description,
            filter_ignore: this._filter_ignore || undefined,
            hidden: this._hidden || undefined,
        };
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

    protected async load(data: RegTagInstanceData): Promise<void> {
        this.Value = data.val ?? null;
        let Tag = await this.Registry.resolve(data.tag);
        if(!Tag) {
            console.error(`Tag ${data.tag.id} not found - defaulting to an anonymous tag.`);
            Tag = new TagTemplate(EntryType.TAG, this.Registry, "error", {
                description: "INVALID",
                id: "INVALID",
                name: "INVALID",
                filter_ignore: true,
                hidden: false // Want it to be seen so it can be fixed
            });
            await Tag.ready();
        }
        this.Tag = Tag;
    }

    public async save(): Promise<RegTagInstanceData> {
        return {
            val: this.Value ?? undefined,
            tag: this.Tag.as_ref()
        }
    }

    // Unpacks this tag instance, forming a proper reg ref instead of the old shoddy id lookup based thing
    public static async unpack(inst: PackedTagInstanceData, reg: Registry): Promise<TagInstance> {
        // Just create an unresolved ref
        let dat: RegTagInstanceData =  {
            tag: {
                id: inst.id,
                type: EntryType.TAG,
                is_unresolved_mmid: true
            },
            val: inst.val
        }
        let ti = new TagInstance(reg, dat);
        await ti.ready();
        return ti;
    }
}