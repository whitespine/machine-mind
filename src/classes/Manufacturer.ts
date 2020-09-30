import { ItemType } from '@/class';
import { imageManagement, ImageTag } from "@/hooks";
import { ident, MixBuilder, MixLinks, RWMix, uuid } from '@/mixmeta';
import { VRegistryItem } from './CompendiumItem';

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

export interface Manufacturer extends MixLinks<IManufacturerData>, VRegistryItem {
    ID: string;
    Type: ItemType.MANUFACTURER;
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
    mb.with(new RWMix("ID", "name", uuid(), ident, ident));
    mb.with(new RWMix("Name", "name", "New Manufacturer", ident, ident));
    mb.with(new RWMix("Description", "description", "No description", ident, ident));
    mb.with(new RWMix("Logo", "logo", "", ident, ident));
    mb.with(new RWMix("LogoURL", "logo_url", "", ident, ident));
    mb.with(new RWMix("Light", "light", "", ident, ident));
    mb.with(new RWMix("Dark", "dark",  "", ident, ident));
    mb.with(new RWMix("Quote", "quote",  "", ident, ident));

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