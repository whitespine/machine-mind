import { Rules, LicensedItem, EntryType, CoreSystem } from "@/class";
import { ILicensedItemData, IActionData, IBonusData, ISynergyData, IDeployableData, ICounterData, ICoreSystemData, IFrameTraitData } from "@/interface";
import { imageManagement, ImageTag } from "@/hooks";
import { IArtLocation } from '../Art';
import { CreateFrameTrait, FrameTrait } from './FrameTrait';
import { ident, ident_drop_null, MixBuilder, RWMix, MixLinks, ser_many, ser_one, uuid, ident_drop_anon, def_anon, defn, defs, def, def_empty, def_empty_map, def_lazy, defn_null, defs_null, ident_strict, ident_drop_anon_strict } from '@/mixmeta';
import { CreateCoreSystem } from './CoreSystem';
import { Registry, VRegistryItem } from '../registry';
import { MountType } from '../enums';

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

// We take those of the everest
const DEFAULT_STATS: IFrameStats = {
    armor: 0,
    edef: 8,
    evasion: 8,
    heatcap: 6,
    hp: 10,
    repcap: 5,
    save: 10,
    sensor_range: 10,
    size: 1,
    sp: 6,
    speed: 4,
    tech_attack: 0
}




export interface IFrameData  {
  id: string, // E.x. DRAKE
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

export interface Frame extends MixLinks<IFrameData>, VRegistryItem {
    LicenseLevel: number;
    Source: string;
    Name: string;
    Mechtype: string[],
    YPosition: number,
    Description: string,
    Mounts: MountType[],
    BaseStats: IFrameStats,
    Traits: FrameTrait[],
    Core: CoreSystem,
    ImageURL: string | null;
    OtherArt: IArtLocation[];

    // Methods
    default_image(): string;
}

export async function CreateFrame(data: IFrameData | null, ctx: Registry): Promise<Frame> {
    let mb = new MixBuilder<Frame, IFrameData>({default_image});
    mb.with(new RWMix("ID", "id", ident_strict, ident_drop_anon_strict));
    mb.with(new RWMix("LicenseLevel", "license_level", defn(2), ident));
    mb.with(new RWMix("Source", "source", defs("GMS"), ident));
    mb.with(new RWMix("Name", "name", defs("New Frame"), ident));
    mb.with(new RWMix("Mechtype", "mechtype", def<string[]>(["Balanced"]), ident));
    mb.with(new RWMix("YPosition", "y_pos", defn(0), ident));
    mb.with(new RWMix("Description", "description", defs("No description"), ident));
    mb.with(new RWMix("Mounts", "mounts", def<MountType[]>([]), ident));
    mb.with(new RWMix("BaseStats", "stats", def_lazy<IFrameStats>(async () => _.cloneDeep(DEFAULT_STATS)), ident));
    mb.with(new RWMix("Traits", "traits", def_empty_map(CreateFrameTrait), ser_many));
    mb.with(new RWMix("Core", "core_system", CreateCoreSystem, ser_one));
    mb.with(new RWMix("ImageURL", "image_url", defs_null(null), ident_drop_null));
    mb.with(new RWMix("OtherArt", "other_art", def<IArtLocation[]>([]), ident));

    return mb.finalize(data, ctx);
}

function default_image(this: Frame): string {
    if (this.ImageURL) return this.ImageURL;
    return imageManagement.getImagePath(ImageTag.Frame, `${this.FrameID}.png`, true);
}
