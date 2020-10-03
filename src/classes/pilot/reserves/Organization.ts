import { OrgType } from "@/class";
import { bound_int } from '@/funcs';
import { ident, MixBuilder, MixLinks, RWMix } from '@/mixmeta';

export interface IOrganizationData {
    name: string;
    purpose: OrgType;
    description: string;
    efficiency: number;
    influence: number;
    actions: string;
}

export interface Organization extends MixLinks<IOrganizationData>{
    Name: string;
    Purpose: OrgType;
    Description: string;
    Efficiency: number;
    Influence: number;
    Actions: string;
}

export function CreateOrganization(data: IOrganizationData | null): Organization {
    let mb = new MixBuilder<Organization, IOrganizationData>({});
    mb.with(new RWMix("Name", "name", ident, ident));
    mb.with(new RWMix("Purpose", "purpose", ident, ident));
    mb.with(new RWMix("Description", "description", ident, ident));
    mb.with(new RWMix("Actions", "actions", ident, ident));

    // Bound these
    mb.with(new RWMix("Efficiency", "efficiency", ident, ident)).add_pre_set_hook(x => bound_int(x, 0, 6));
    mb.with(new RWMix("Influence", "influence", ident, ident)).add_pre_set_hook(x => bound_int(x, 0, 6));

    return mb.finalize(data);
}


