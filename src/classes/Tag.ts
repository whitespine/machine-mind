import { EntryType } from "@/class";

import { MixLinks, MixBuilder, RWMix, uuid, ident, ser_many, ident_drop_anon, def_anon, defs, defb, ident_strict, def_empty_map, def_empty } from '@/mixmeta';
import { Registry, VRegistryItem } from './registry';

export interface ITagTemplateData {
    id: string;
    name: string;
    description: string;
    filter_ignore?: boolean;
    hidden?: boolean;
}

export interface ITagInstanceData {
    id: string;
    val?: string | number;
}

export interface TagTemplate extends MixLinks<ITagTemplateData>, VRegistryItem {
    Description: string;
    FilterIgnore: boolean;
    Hidden: boolean;
    EntryType: EntryType.TAG;
}

export interface TagInstance extends MixLinks<ITagInstanceData> {
    TemplateID: string;
    Val: number | string;
}

export async function CreateTagTemplate(data: ITagTemplateData | null, ctx: Registry): Promise<TagTemplate> {
    let b = new MixBuilder<TagTemplate, ITagTemplateData>({
        EntryType: EntryType.TAG
    });
    b.with(new RWMix("ID", "id", def_anon, ident_drop_anon));
    b.with(new RWMix("Name", "name", defs("New Tag"), ident));
    b.with(new RWMix("Description", "description", defs("Tag description"), ident));
    b.with(new RWMix("FilterIgnore", "filter_ignore", defb(false), ident));
    b.with(new RWMix("Hidden", "hidden", defb(false), ident));
    return b.finalize(data, ctx);
}

export async function CreateTagInstance(data: ITagInstanceData | null, ctx: Registry): Promise<TagInstance> {
    let b = new MixBuilder<TagInstance, ITagInstanceData>({});
    b.with(new RWMix("TemplateID", "id", ident_strict, ident));
    b.with(new RWMix("Val", "val", ident_strict, ident));
    return b.finalize(data, ctx);
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const TagTemplateMixReader = def_empty_map(CreateTagTemplate);
export const TagInstanceMixReader = def_empty_map(CreateTagInstance);

/*
    public GetDescription(addBonus?: number | null): string {
        let bonus = 0;
        if (this.ID === "tg_limited") bonus = addBonus || 0;
        if (!this._val) return this._description;
        if (typeof this._val === "number") {
            return this._description.replace(/{VAL}/g, (this._val + bonus).toString());
        } else {
            const str = this._val as string;
            if (str.includes("+")) {
                const split = str.split("+");
                const newVal = `${split[0]}+${parseInt(split[1]) + bonus}`;
                const newDesc = this._description.replace(/{VAL}/g, newVal);
                return bonus ? `${newDesc} (+${bonus})` : newDesc;
            } else {
                return bonus > 0
                    ? this._description.replace(/{VAL}/g, `${this._val}+${bonus}`)
                    : this._description.replace(/{VAL}/g, this._val);
            }
        }
    }

    public get Name(): string {
        return this._name.replace(/{VAL}/g, "X");
    }

    public GetName(addBonus?: number | null): string {
        let bonus = 0;
        if (this.IsLimited) bonus = addBonus || 0;
        if (!this._val) return this._name;
        if (typeof this._val === "number") {
            return this._name.replace(/{VAL}/g, (this._val + bonus).toString());
        } else {
            const str = this._val as string;
            if (str.includes("+")) {
                const split = str.split("+");
                const newVal = `${split[0]}+${parseInt(split[1]) + bonus}`;
                const newName = this._name.replace(/{VAL}/g, newVal);
                return bonus ? `${newName} (+${bonus})` : newName;
            } else {
                return bonus > 0
                    ? this._name.replace(/{VAL}/g, `${this._val}+${bonus}`)
                    : this._name.replace(/{VAL}/g, this._val);
            }
        }
    }

    public get EntryType(): EntryType {
        return this._item_type;
    }

    public get Brew(): string {
        return this._brew;
    }

    public get IsUnique(): boolean {
        return this._id === "tg_unique";
    }

    public get IsAI(): boolean {
        return this._id === "tg_ai";
    }

    public get IsLimited(): boolean {
        return this._id === "tg_limited";
    }

    public get IsLoading(): boolean {
        return this._id === "tg_loading";
    }

    public get IsRecharging(): boolean {
        return this._id === "tg_recharge";
    }

    public get IsIndestructible(): boolean {
        return this._id === "tg_indestructible";
    }

    public static Deserialize(data: ITagData[]): Tag[] {
        const output = [] as Tag[];
        if (!data) return output;
        data.forEach(x => {
            const t = store.compendium.instantiate("Tags", x.id);
            if (x.val) t.Value = x.val;
            output.push(t);
        });
        return output;
    }
}
*/