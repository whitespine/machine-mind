//
import { EntryType, ReserveType } from "@/class";
import { ident, MixBuilder, MixLinks, restrict_enum, RWMix, uuid } from '@/mixmeta';
import { VRegistryItem } from '@/interface';

export interface IReserveData {
    id: string;
    type?: string ;
    name?: string ;
    label?: string ;
    description?: string ;
    resource_name?: string ;
    resource_note?: string ;
    resource_cost?: string ;
    used: boolean;
}

// Exists in the registry. However, pilots typically keep their own copies
// We might wish to find a way to disentangle these concepts, but for the time being that feels difficult
export interface Reserve extends MixLinks<IReserveData>, VRegistryItem {
    ID: string;
    Type: EntryType.RESERVE;
    Name: string;
    Label: string;
    Description: string;
    ReserveType: ReserveType;
    ResourceName: string;
    ResourceNote: string;
    ResourceCost: string;
    Used: boolean; // Only relevant on "owned" instances
}

export function CreateReserve(data: IReserveData | null): Reserve {
    let mb = new MixBuilder<Reserve, IReserveData>({});
    mb.with(new RWMix("ID", "name", ident, ident));
    mb.with(new RWMix("Name", "name", ident, ident));
    mb.with(new RWMix("Description", "description", ident, ident));
    mb.with(new RWMix("ReserveType", "type", restrict_enum(ReserveType, ReserveType.Resources), ident));
    mb.with(new RWMix("ResourceCost", "resource_cost", ident, ident));
    mb.with(new RWMix("ResourceNote", "resource_note", ident, ident));
    mb.with(new RWMix("ResourceName", "resource_name", ident, ident));
    mb.with(new RWMix("Used", "used", ident, ident));
    return mb.finalize(data);
}



// public get Color(): string {
    // return this._used ? "grey darken-1" : `reserve--${this.type.toLowerCase()}`;
// }



