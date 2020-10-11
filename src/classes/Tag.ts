import { EntryType } from "@/class";

import {
    MixLinks,
    MixBuilder,
    RWMix,
    uuid,
    ident,
    ser_many,
    defs,
    defb,
    ident_strict,
    def_empty_map,
    def_empty,
} from "@/mixmeta";
import { SimSer } from "@/new_meta";

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

export class TagTemplate extends SimSer<ITagTemplateData> {
    ID!: string;
    Name!: string;
    Description!: string;
    _filter_ignore!: boolean | null; // Whether to ignore this tags data when filtering
    _hidden!: boolean | null;
    EntryType: EntryType.TAG;

    protected load(data: ITagTemplateData): void {
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

    // Helpers
}

export class TagInstance extends Reg {
    template: TagTemplate
}