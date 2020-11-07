import { CoreSystem, FrameTrait } from "@/class";
import { PackedCoreSystemData, PackedFrameTraitData } from "@/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil } from "@/registry";
import { IArtLocation } from "../Art";
import { MechType, MountType } from "../enums";

// The raw stat information
export interface IFrameStats {
    size: number;
    structure: number;
    stress: number;
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

// Entire frame
interface AllFrameData {
    id: string;
    license_level: number; // set to zero for this item to be available to a LL0 character
    source: string; // must be the same as the Manufacturer ID to sort correctly
    name: string;
    mechtype: string[]; // can be customized
    y_pos: number; // used for vertical alignment of the mech in banner views (like in the new mech selector)
    description: string; // v-html
    mounts: MountType[];
    stats: IFrameStats;
    image_url?: string;
    other_art?: IArtLocation[];
}

export interface PackedFrameData extends AllFrameData {
    traits: PackedFrameTraitData[];
    core_system: PackedCoreSystemData;
}

export interface RegFrameData extends AllFrameData {
    traits: RegRef<EntryType.FRAME_TRAIT>[];
    core_system?: RegRef<EntryType.CORE_SYSTEM>;
}

export class Frame extends RegEntry<EntryType.FRAME, RegFrameData> {
    ID!: string;
    LicenseLevel!: number;
    Source!: string;
    Name!: string;
    MechType!: Array<string | MechType>; // Typically mostly MechType
    YPosition!: number;
    Description!: string;
    Mounts!: MountType[];
    Traits!: FrameTrait[];
    CoreSystem!: CoreSystem | null; // For the purposeses of people doing dumb homebrew stuff, we support this
    Stats!: IFrameStats;
    OtherArt!: IArtLocation[];
    ImageUrl!: string | null;

    protected async load(frameData: RegFrameData): Promise<void> {
        this.ID = frameData.id;
        this.LicenseLevel = frameData.license_level;
        this.Source = frameData.source;
        this.Name = frameData.name;
        this.MechType = frameData.mechtype;
        this.YPosition = frameData.y_pos || 30;
        this.Mounts = frameData.mounts;
        this.Stats = frameData.stats;
        this.Traits = await this.Registry.resolve_many(frameData.traits);
        this.CoreSystem = frameData.core_system
            ? await this.Registry.resolve(frameData.core_system)
            : null;
        this.ImageUrl = frameData.image_url || null;
        this.OtherArt = frameData.other_art || [];
    }

    public async save(): Promise<RegFrameData> {
        return {
            id: this.ID,
            description: this.Description,
            license_level: this.LicenseLevel,
            source: this.Source,
            name: this.Name,
            mechtype: this.MechType,
            y_pos: this.YPosition,
            mounts: this.Mounts,
            stats: this.Stats,
            traits: SerUtil.ref_all(this.Traits),
            core_system: this.CoreSystem?.as_ref(),
            image_url: this.ImageUrl ?? undefined,
            other_art: this.OtherArt,
        };
    }

    public static async unpack(frame: PackedFrameData, reg: Registry): Promise<Frame> {
        let traits = await SerUtil.unpack_children(FrameTrait.unpack, reg, frame.traits);
        let cs = await CoreSystem.unpack(frame.core_system, reg);
        let fdata: RegFrameData = {
            ...frame,
            traits: SerUtil.ref_all(traits),
            core_system: cs.as_ref(),
        };
        return reg.get_cat(EntryType.FRAME).create(fdata);
    }

    public get MechTypeString(): string {
        if (this.MechType.length === 1) return this.MechType[0];
        return `${this.MechType[0]} / ${this.MechType[1]}`;
    }

    public get SizeIcon(): string {
        return `cci-size-${this.Stats.size === 0.5 ? "half" : this.Stats.size}`;
    }

    public get DefaultImage(): string {
        if (this.ImageUrl) return this.ImageUrl;
        return ""; // TODO, maybe
        // return getImagePath(ImageTag.Frame, `${this.ID}.png`, true);
    }

    // For consistency's sake
    public get License(): string {
        return this.Name;
    }
}
