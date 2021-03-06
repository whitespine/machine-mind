import { MechWeapon, Tag } from "@/class";
import { ITagData } from "@/interface";
import { store } from "@/hooks";

export interface ICoreData {
    name: string;
    description: string;
    integrated?: { id: string } | null;
    passive_name?: string | null;
    passive_effect?: string | null;
    active_name: string;
    active_effect: string;
    tags: ITagData[];
}

export class CoreSystem {
    private _name: string;
    private _description: string;
    private _integrated: string | null;
    private _passive_name: string | null;
    private _passive_effect: string | null;
    private _active_name: string;
    private _active_effect: string;
    private _tags: ITagData[];

    public constructor(coreData: ICoreData) {
        this._name = coreData.name;
        this._description = coreData.description;
        this._integrated = coreData.integrated ? coreData.integrated.id : null;
        this._passive_name = coreData.passive_name || null;
        this._passive_effect = coreData.passive_effect || null;
        this._active_name = coreData.active_name;
        this._active_effect = coreData.active_effect;
        this._tags = coreData.tags;
    }

    public get Name(): string {
        return this._name;
    }

    public get Description(): string {
        return this._description;
    }

    public get Integrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.getReferenceByID("MechWeapons", this._integrated);
    }

    public getIntegrated(): MechWeapon | null {
        if (!this._integrated) return null;
        return store.compendium.instantiate("MechWeapons", this._integrated);
    }

    public get PassiveName(): string | null {
        return this._passive_name || null;
    }

    public get PassiveEffect(): string | null {
        return this._passive_effect || null;
    }

    public get ActiveName(): string {
        return this._active_name;
    }

    public get ActiveEffect(): string {
        return this._active_effect;
    }

    public get Tags(): Tag[] {
        return Tag.Deserialize(this._tags);
    }
}
