import { ItemType } from "@/class";

import { VCompendiumItem } from "@/interface";
import { store } from "@/hooks";
import { MixLinks, MixBuilder, Mixlet, uuid, ident } from '@/mixmeta';
import { DEFAULT_BREW_ID } from './enums';

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

export interface TagTemplate extends MixLinks<ITagTemplateData>, VCompendiumItem {
    Description: string;
    FilterIgnore: boolean;
    Hidden: boolean;
    ItemType: ItemType.Tag;
}

export interface TagInstance extends MixLinks<ITagInstanceData> {
    TemplateID: string;
    Val: number | string;
}

export function CreateTagTemplate(data: ITagTemplateData | null): TagTemplate {
    let b = new MixBuilder<TagTemplate, ITagTemplateData>({
        ItemType: ItemType.Tag,
        Brew: DEFAULT_BREW_ID
    });
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Name", "name", "New Tag", ident, ident));
    b.with(new Mixlet("Description", "description", "", ident, ident));
    b.with(new Mixlet("FilterIgnore", "filter_ignore", false, ident, ident));
    b.with(new Mixlet("Hidden", "hidden", false, ident, ident));
    let r = b.finalize(data);
    return r;
}

export function CreateTagInstance(data: ITagInstanceData | null): TagInstance {
    let b = new MixBuilder<TagInstance, ITagInstanceData>({});
    b.with(new Mixlet("TemplateID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Val", "val", "", ident, ident));
    let r = b.finalize(data);
    return r;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const TagTemplateMixReader = (x: ITagTemplateData[] | undefined) => (x || []).map(CreateTagTemplate);
export const TagTemplateMixWriter = (x: TagTemplate[]) => x.map(i => i.Serialize());
export const TagInstanceMixReader = (x: ITagInstanceData[] | undefined) => (x || []).map(CreateTagInstance);
export const TagInstanceMixWriter = (x: TagInstance[]) => x.map(i => i.Serialize());

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

    public get ItemType(): ItemType {
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