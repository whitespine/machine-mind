/*

Probably best to just nuke this one. its only real unique feature (progress) can more or less just be accomplished via counters

import { Reserve } from "@src/class";
import { IReserveData } from "./Reserve";

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
    mb.with(new RWMix("LID", "name", ident, ident));
    mb.with(new RWMix("Name", "name", ident, ident));
    mb.with(new RWMix("Description", "description", ident, ident));
    mb.with(
        new RWMix("ReserveType", "type", restrict_enum(ReserveType, ReserveType.Resources), ident)
    );
    mb.with(new RWMix("ResourceCost", "resource_cost", ident, ident));
    mb.with(new RWMix("ResourceNote", "resource_note", ident, ident));
    mb.with(new RWMix("ResourceName", "resource_name", ident, ident));
    mb.with(new RWMix("Used", "used", ident, ident));
    ////////////////////
    mb.with(new RWMix("Complicated", "complicated", ident, ident));
    mb.with(new RWMix("CanFinish", "can_finish", ident, ident));
    mb.with(new RWMix("Finished", "finished", ident, ident));
    mb.with(new RWMix("Progress", "progress", ident, ident));
    mb.with(new RWMix("Requirements", "requirements", ident, ident));
    return mb.finalize(data);
}

*/
