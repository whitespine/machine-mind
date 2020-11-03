import { imageManagement, ImageTag } from "@/hooks";
import { EntryType, RegEntry, SimSer } from "@/registry";

export interface IManufacturerData {
    id: string;
    name: string;
    logo: string;
    logo_url?: string;
    light: string;
    description: string;
    dark: string;
    quote: string;
}

export class Manufacturer extends RegEntry<EntryType.MANUFACTURER, IManufacturerData> {
    ID!: string;
    Name!: string;
    Description!: string;
    private _logo!: string;
    LogoURL!: string | null;
    Light!: string;
    Dark!: string;
    Quote!: string;

    protected async load(data: IManufacturerData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this._logo = data.logo;
        this.LogoURL = data.logo_url || null;
        this.Light = data.light;
        this.Dark = data.dark;
        this.Quote = data.quote;
        this.Description = data.description;
    }
    public async save(): Promise<IManufacturerData> {
        return {
            id: this.ID,
            name: this.Name,
            logo: this._logo,
            logo_url: this.LogoURL || undefined,
            light: this.Light,
            dark: this.Dark,
            quote: this.Quote,
            description: this.Description,
        };
    }

    public GetColor(dark?: boolean): string {
        return dark ? this.Dark : this.Light;
    }

    public get LogoIsExternal(): boolean {
        return !!this.LogoURL;
    }

    public get Logo(): string {
        if (this.LogoURL) return this.LogoURL;
        else if (this._logo)
            return imageManagement.getImagePath(ImageTag.Logo, `${this._logo}.svg`, true);
        else return ""; // TODO: placeholder logo?
    }
}
