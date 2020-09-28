import { Rules, LicensedItem, MountType, ItemType, MechType, CoreSystem } from "@/class";
import { ILicensedItemData, IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ICoreSystemData, IFrameTraitData } from "@/interface";
import { imageManagement, ImageTag } from "@/hooks";
import { IArtLocation } from '../Art';
import { FrameTrait } from './FrameTrait';
import { ident, MixBuilder, Mixlet, MixLinks, uuid } from '@/mixmeta';

// Handles the base numberage
export interface IFrameStats {
    size: number;
    armor: number;
    hp: number;
    evasion: number;
    edef: number;
    heatcap: number;
    repcap: number;
    sensor_range: number;
    tech_attack: number;
    save: number;
    speed: number;
    sp: number;
}




export interface IFrameData  {
  id: string,
  license_level: number, // set to zero for this item to be available to a LL0 character
  source: string, // must be the same as the Manufacturer ID to sort correctly
  name: string,
  mechtype: string[], // can be customized. ex. striker, defender
  y_pos: number, // used for vertical alignment of the mech in banner views (like in the new mech selector)
  description: string, // v-html
  mounts: MountType[],
  stats: IFrameStats,
  traits: IFrameTraitData[],
  core_system: ICoreSystemData,
  image_url?: string,
  other_art?: IArtLocation[]
}

export interface Frame extends MixLinks<IFrameData>{
    ID: string;
    LicenseLevel: number;
    Source: string;
    Name: string;
    Mechtype: string[],
    YPosition: number,
    Description: string,
    Mounts: MountType[],
    Stats: FrameStats,
    Traits: FrameTrait[],
    Core: CoreSystem,
    ImageURL: string | null;
    OtherArt: IArtLocation[];
}

export function CreateFrame(data: IFrameData | null): Frame {
    let mb = new MixBuilder<Frame, IFrameData>({});
    mb.with(new Mixlet("ID", "id", uuid(), ident, ident));
    mb.with(new Mixlet("LicenseLevel", "license_level", 1, ident, ident));
    mb.with(new Mixlet("Source", "source", "GMS", ident, ident));
    mb.with(new Mixlet("Name", "name", "New Frame", ident, ident));
    mb.with(new Mixlet("Mechtype", "mechtype", [], ident, ident));
    mb.with(new Mixlet("YPosition", "y_pos", 0, ident, ident));
    mb.with(new Mixlet("Description", "description", "No description", ident, ident));
    mb.with(new Mixlet("Mounts", "mounts", [], ident, ident));
    mb.with(new Mixlet("Stats", "stats", [], ident, ident));
    mb.with(new Mixlet("Traits", "traits", [], ident, ident));
    mb.with(new Mixlet("Core", "core_system", CreateCoreSystem(null), ident, ident));
    mb.with(new Mixlet("ImageURL", "image_url", null, ident, ident));
    mb.with(new Mixlet("OtherArt", "other_art", [], ident, ident));


    return mb.finalize(data);
}

function DefaultImage(this: Frame): string {
    if (this.ImageURL) return this.ImageURL;
    return imageManagement.getImagePath(ImageTag.Frame, `${this.ID}.png`, true);
}
