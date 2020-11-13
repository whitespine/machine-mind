import { CoreSystem, FrameTrait } from "@src/class";
import { defaults } from "@src/funcs";
import { PackedCoreSystemData, PackedFrameTraitData } from "@src/interface";
import { EntryType, OpCtx, quick_mm_ref, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { IArtLocation } from "../Art";
import { MechType, MountType } from "../enums";
import { Manufacturer } from '../Manufacturer';

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
    source: string;
}

export interface RegFrameData extends Required<AllFrameData> {
    traits: RegRef<EntryType.FRAME_TRAIT>[];
    core_system: RegRef<EntryType.CORE_SYSTEM> | null;
    source: RegRef<EntryType.MANUFACTURER> | null;
}

export class Frame extends RegEntry<EntryType.FRAME> {
    ID!: string;
    LicenseLevel!: number;
    Source!: Manufacturer | null;
    Name!: string;
    MechType!: Array<string | MechType>; // Typically mostly MechType
    YPosition!: number;
    Description!: string;
    Mounts!: MountType[];
    Traits!: FrameTrait[];
    CoreSystem!: CoreSystem | null; // For the purposeses of people doing dumb homebrew stuff, we support this
    Stats!: IFrameStats;
    OtherArt!: IArtLocation[];
    ImageUrl!: string;

    public async load(frameData: RegFrameData): Promise<void> {
        frameData = { ...defaults.FRAME(), ...frameData };
        this.ID = frameData.id;
        this.LicenseLevel = frameData.license_level;
        this.Source = frameData.source ? await this.Registry.resolve(this.OpCtx, frameData.source) : null;
        this.Name = frameData.name;
        this.Description = frameData.description;
        this.MechType = frameData.mechtype;
        this.YPosition = frameData.y_pos || 30;
        this.Mounts = frameData.mounts;
        this.Stats = frameData.stats;
        this.Traits = await this.Registry.resolve_many(this.OpCtx, frameData.traits);
        this.CoreSystem = frameData.core_system
            ? await this.Registry.resolve(this.OpCtx, frameData.core_system)
            : null;
        this.ImageUrl = frameData.image_url;
        this.OtherArt = frameData.other_art || [];
    }

    public async save(): Promise<RegFrameData> {
        return {
            id: this.ID,
            description: this.Description,
            license_level: this.LicenseLevel,
            source: this.Source?.as_ref() ?? null,
            name: this.Name,
            mechtype: this.MechType,
            y_pos: this.YPosition,
            mounts: this.Mounts,
            stats: this.Stats,
            traits: SerUtil.ref_all(this.Traits),
            core_system: this.CoreSystem?.as_ref() || null,
            image_url: this.ImageUrl,
            other_art: this.OtherArt,
        };
    }

    public static async unpack(frame: PackedFrameData, reg: Registry, ctx: OpCtx): Promise<Frame> {
        let traits = await SerUtil.unpack_children(FrameTrait.unpack, reg, ctx, frame.traits);
        let cs = await CoreSystem.unpack(frame.core_system, reg, ctx);
        let fdata: RegFrameData = {
            ...defaults.FRAME(),
            ...frame,
            source: quick_mm_ref(EntryType.MANUFACTURER, frame.source),
            traits: SerUtil.ref_all(traits),
            core_system: cs.as_ref(),
            image_url: frame.image_url ?? "",
            other_art: frame.other_art ?? [],
        };
        return reg.get_cat(EntryType.FRAME).create(ctx, fdata);
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

    public get_child_entries(): RegEntry<any>[] {
        return [...this.Traits, ...(this.CoreSystem ? [this.CoreSystem] : [])];
    }
}
