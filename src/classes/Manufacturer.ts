import { imageManagement, ImageTag } from "@/hooks";

export interface IManufacturerData {
    id: string;
    name: string;
    logo: string;
    logo_url?: string | null;
    light: string;
    description: string;
    dark: string;
    quote: string;
}

export class Manufacturer {
    private _id: string;
    private _name: string;
    private _description: string;
    private _quote: string;
    private _logo: string;
    private _light: string;
    private _dark: string;
    private _logo_url: string | null;

    public constructor(data: IManufacturerData) {
        this._id = data.id;
        this._name = data.name;
        this._description = data.description;
        this._quote = data.quote;
        this._logo = data.logo;
        this._light = data.light;
        this._dark = data.dark;
        this._logo_url = data.logo_url || null;
    }

    public get ID(): string {
        return this._id;
    }

    public get Name(): string {
        return this._name;
    }

    public get Description(): string {
        return this._description;
    }

    public get Quote(): string {
        return this._quote;
    }

    public GetColor(dark?: boolean): string {
        return dark ? this._dark : this._light;
    }
    public get Light(): string {
        return this._light;
    }
    public get Dark(): string {
        return this._dark;
    }

    public get LogoIsExternal(): boolean {
        return !!this._logo_url;
    }

    public get Logo(): string {
        if (this._logo_url) return this._logo_url;
        else if (this._logo)
            return imageManagement.getImagePath(ImageTag.Logo, `${this._logo}.svg`, true);
        else return ""; // TODO: placeholder logo?
    }
}
