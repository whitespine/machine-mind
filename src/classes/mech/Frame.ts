import { CoreSystem, FrameTrait } from "@src/class";
import { defaults } from "@src/funcs";
import { PackedCoreSystemData, PackedFrameTraitData } from "@src/interface";
import { EntryType, OpCtx, quick_local_ref, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { IArtLocation } from "../Art";
import { MechType, MountType } from "../../enums";
import { Manufacturer } from "../Manufacturer";
import { RegFrameTraitData } from './FrameTrait';
import { RegCoreSystemData } from './CoreSystem';

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
    traits: RegFrameTraitData[];
    core_system: RegCoreSystemData;
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
    CoreSystem!: CoreSystem;
    Stats!: IFrameStats;
    OtherArt!: IArtLocation[];
    ImageUrl!: string;

    public async load(fd: RegFrameData): Promise<void> {
        fd = { ...defaults.FRAME(), ...fd };
        this.ID = fd.id;
        this.LicenseLevel = fd.license_level;
        this.Source = fd.source
            ? await this.Registry.resolve(this.OpCtx, fd.source)
            : null;
        this.Name = fd.name;
        this.Description = fd.description;
        this.MechType = fd.mechtype;
        this.YPosition = fd.y_pos || 30;
        this.Mounts = fd.mounts;
        this.Stats = fd.stats;
        this.Traits = await Promise.all(fd.traits.map(ft => new FrameTrait(this.Registry, this.OpCtx, ft).ready()));
        this.CoreSystem = await new CoreSystem(this.Registry, this.OpCtx,  fd.core_system).ready();
        this.ImageUrl = fd.image_url;
        this.OtherArt = fd.other_art || [];
    }

    protected save_imp(): RegFrameData {
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
            traits: SerUtil.save_all(this.Traits),
            core_system: this.CoreSystem.save(),
            image_url: this.ImageUrl,
            other_art: this.OtherArt,
        };
    }

    public static async unpack(frame: PackedFrameData, reg: Registry, ctx: OpCtx): Promise<Frame> {
        let traits = await SerUtil.unpack_children(FrameTrait.unpack, reg, ctx, frame.traits);
        let core_system = await CoreSystem.unpack(frame.core_system, reg, ctx);
        let fdata: RegFrameData = {
            ...defaults.FRAME(),
            ...frame,
            source: quick_local_ref(reg, EntryType.MANUFACTURER, frame.source),
            traits,
            core_system,
            image_url: frame.image_url ?? "",
            other_art: frame.other_art ?? [],
        };
        return reg.get_cat(EntryType.FRAME).create_live(ctx, fdata, true);
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

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Traits.flatMap(t => t.get_assoc_entries()), ...this.CoreSystem.get_assoc_entries()];
    }
}
