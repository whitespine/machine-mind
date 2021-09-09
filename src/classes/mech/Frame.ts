import { CoreSystem, FrameTrait, Manufacturer } from "@src/class";
import { defaults } from "@src/funcs";
import {
    PackedCoreSystemData,
    PackedCounterData,
    PackedFrameTraitData,
    RegCoreSystemData,
    RegFrameTraitData,
} from "@src/interface";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { IArtLocation } from "../Art";
import { MechType, MountType } from "@src/enums";
import { merge_defaults } from "../default_entries";

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
    id: string;
    traits: PackedFrameTraitData[];
    core_system: PackedCoreSystemData;
    source: string;
    variant?: string; // If an alt frame, this is the primary license name
}

export interface RegFrameData extends Required<AllFrameData> {
    lid: string;
    license: string;
    traits: RegFrameTraitData[];
    core_system: RegCoreSystemData;
    source: RegRef<EntryType.MANUFACTURER> | null;
}

export class Frame extends RegEntry<EntryType.FRAME> {
    LID!: string;
    License!: string;
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
        merge_defaults(fd, defaults.FRAME());
        this.LID = fd.lid;
        this.License = fd.license;
        this.LicenseLevel = fd.license_level;
        this.Source = fd.source
            ? await this.Registry.resolve(this.OpCtx, fd.source, { wait_ctx_ready: false })
            : null;
        this.Name = fd.name;
        this.Description = fd.description;
        this.MechType = fd.mechtype;
        this.YPosition = fd.y_pos || 30;
        this.Mounts = fd.mounts;
        this.Stats = fd.stats;
        this.Traits = await Promise.all(
            fd.traits.map(ft => new FrameTrait(this.Registry, this.OpCtx, ft))
        );
        this.CoreSystem = new CoreSystem(this.Registry, this.OpCtx, fd.core_system);
        this.ImageUrl = fd.image_url;
        this.OtherArt = fd.other_art || [];
    }

    protected save_imp(): RegFrameData {
        return {
            lid: this.LID,
            description: this.Description,
            license: this.License,
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
        // Tweak license to handle alt frames + so that GMS frames just becomes GMS
        let license = frame.variant ?? frame.name;
        if (license == "EVEREST") {
            license = "GMS";
        }

        // Some frames have counters outside core. This is out of spec but we still gotta deal with it
        if((frame as any).counters) {
            frame.core_system.counters = (frame.core_system.counters ?? []).concat((frame as any).counters);
            delete (frame as any).counters;
        }

        let traits = await Promise.all(
            (frame.traits ?? []).map(i => FrameTrait.unpack(i, reg, ctx, frame.id))
        );
        let core_system = await CoreSystem.unpack(frame.core_system, reg, ctx);
        let fdata: RegFrameData = merge_defaults(
            {
                description: frame.description,
                license,
                license_level: frame.license_level,
                mechtype: frame.mechtype,
                mounts: frame.mounts,
                name: frame.name,
                stats: frame.stats,
                y_pos: frame.y_pos,
                lid: frame.id,
                source: quick_local_ref(reg, EntryType.MANUFACTURER, frame.source),
                traits,
                core_system,
                image_url: frame.image_url ?? "",
                other_art: frame.other_art ?? [],
            },
            defaults.FRAME()
        );
        return reg.get_cat(EntryType.FRAME).create_live(ctx, fdata);
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
        // return getImagePath(ImageTag.Frame, `${this.LID}.png`, true);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [
            ...this.Traits.flatMap(t => t.get_assoc_entries()),
            ...this.CoreSystem.get_assoc_entries(),
        ];
    }

    public async emit(): Promise<PackedFrameData> {
        let result: PackedFrameData = {
            core_system: await this.CoreSystem.emit(),
            description: this.Description,
            id: this.LID,
            license_level: this.LicenseLevel,
            mechtype: this.MechType,
            mounts: this.Mounts,
            name: this.Name,
            source: this.Source?.LID ?? "GMS",
            stats: this.Stats,
            traits: await SerUtil.emit_all(this.Traits),
            y_pos: this.YPosition,
            image_url: this.ImageUrl,
            other_art: this.OtherArt,
        };
        if (this.Name != this.License) {
            result.variant = this.License;
        }
        return result;
    }
}
