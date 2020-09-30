import { ItemType, Reserve, ReserveType } from "@/class";
import { ident, MixBuilder, MixLinks, restrict_enum, RWMix, uuid } from '@/mixmeta';
import { IReserveData } from './Reserve';


export interface IProjectData extends IReserveData {
    complicated: boolean;
    can_finish: boolean;
    finished: boolean;
    progress: number;
    requirements: string[];
}

export interface Project extends MixLinks<IProjectData> {
    // Dup of reserve.
    ID: string;
    Type: ItemType.RESERVE;
    Name: string;
    Label: string;
    Description: string;
    ReserveType: ReserveType;
    ResourceName: string;
    ResourceNote: string;
    ResourceCost: string;
    Used: boolean; // Only relevant on "owned" instances

    ///////
    Complicated: boolean;
    CanFinish: boolean;
    Finished: boolean;
    Progress: number;
    Requirements: string[];
}

export function CreateProject(data: IProjectData | null): Project {
    let mb = new MixBuilder<Project, IProjectData>({});

    ///////////////////
    // Unfortunately thjis is redundant with Reserve. We haven't really got a good way of efficiently handling subclasses. Much like foundry ;)
    mb.with(new RWMix("ID", "name", uuid(), ident, ident));
    mb.with(new RWMix("Name", "name", "New reserve", ident, ident));
    mb.with(new RWMix("Description", "description", "No description", ident, ident));
    mb.with(new RWMix("ReserveType", "type", ReserveType.Resources, restrict_enum(ReserveType, ReserveType.Resources), ident));
    mb.with(new RWMix("ResourceCost", "resource_cost", "", ident, ident));
    mb.with(new RWMix("ResourceNote", "resource_note", "", ident, ident));
    mb.with(new RWMix("ResourceName", "resource_name", "", ident, ident));
    mb.with(new RWMix("Used", "used", false, ident, ident));
    ////////////////////
    mb.with(new RWMix("Complicated", "complicated", false, ident, ident));
    mb.with(new RWMix("CanFinish", "can_finish", false, ident, ident));
    mb.with(new RWMix("Finished", "finished", false, ident, ident));
    mb.with(new RWMix("Progress", "progress", 0, ident, ident));
    mb.with(new RWMix("Requirements", "requirements", [], ident, ident));
    return mb.finalize(data);

}


