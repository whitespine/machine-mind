import { def, defs, def_lazy, ident, ident_drop_null, MixBuilder, MixLinks, RWMix, uuid } from '@/mixmeta';
import { VRegistryItem } from '@/classes/registry';

export interface IFactionData {
    id: string;
    name: string;
    description: string;
    logo: string;
    color: string;
    logo_url?: string;
}

export interface Faction extends MixLinks<IFactionData>, VRegistryItem{
    ID: string;
    Name: string;
    Description: string;
    Logo: string;
    LogoURL: string | null;
    Color: string;
}
export function CreateFaction(data: IFactionData | null): Faction {
    let mb = new MixBuilder<Faction, IFactionData>({});
    mb.with(new RWMix("ID", "name", def_lazy(uuid), ident));
    mb.with(new RWMix("Name", "name", defs("New Faction"), ident));
    mb.with(new RWMix("Description", "description", defs("No description"), ident));
    mb.with(new RWMix("Logo", "logo", defs(""), ident));
    mb.with(new RWMix("LogoURL", "logo_url", defs(""), ident_drop_null));
    mb.with(new RWMix("Color", "color", defs("grey"), ident));

    return mb.finalize(data);
}

