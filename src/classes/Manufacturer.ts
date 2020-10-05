import { EntryType } from '@/class';
import { imageManagement, ImageTag } from "@/hooks";
import { VRegistryItem } from '@/interface';
import { defs, def_anon, ident, ident_drop_anon, MixBuilder, MixLinks, RWMix, uuid } from '@/mixmeta';

export interface IManufacturerData {
    id?: string;
    name: string;
    logo: string;
    logo_url?: string;
    light: string;
    description: string;
    dark: string;
    quote: string;
}

export interface Manufacturer extends MixLinks<IManufacturerData>, VRegistryItem {
    Type: EntryType.MANUFACTURER;
    Name: string;
    Description: string;
    Logo: string;
    LogoURL: string;
    Light: string; 
    Dark: string ;
    Quote: string;
}

export function CreateManufacturer(data: IManufacturerData | null): Manufacturer {
    let mb = new MixBuilder<Manufacturer, IManufacturerData>({});
    mb.with(new RWMix("ID", "name", def_anon, ident_drop_anon));
    mb.with(new RWMix("Name", "name", defs("New Manufacturer"), ident));
    mb.with(new RWMix("Description", "description", defs("Manufacturer description"), ident));
    mb.with(new RWMix("Logo", "logo", defs(""), ident));
    mb.with(new RWMix("LogoURL", "logo_url", defs(""), ident));
    mb.with(new RWMix("Light", "light", defs("black"), ident));
    mb.with(new RWMix("Dark", "dark", defs("white"), ident));
    mb.with(new RWMix("Quote", "quote", defs("you could go to 5 or 6 manufacturers, or just one"), ident));

    return mb.finalize(data);
}


/*
    public GetColor(dark?: boolean): string {
        return dark ? this._dark : this._light;
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
*/