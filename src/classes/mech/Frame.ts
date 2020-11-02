import { LicensedItem, CoreSystem } from "@/class";
import { ImageTag } from "@/hooks";
import { ILicensedItemData, ICoreSystemData } from "@/interface";
import { EntryType, RegEntry } from '@/registry';
import { IArtLocation } from "../Art";
import { MechType, MountType } from "../enums";
import { FrameTrait, IFrameTraitData } from "./FrameTrait";

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
export interface IFrameData {
    id: string;
    license_level: number; // set to zero for this item to be available to a LL0 character
    source: string; // must be the same as the Manufacturer ID to sort correctly
    name: string;
    mechtype: string[]; // can be customized
    y_pos: number; // used for vertical alignment of the mech in banner views (like in the new mech selector)
    description: string; // v-html
    mounts: MountType[];
    stats: IFrameStats;
    traits: IFrameTraitData[];
    core_system: ICoreSystemData;
    image_url?: string;
    other_art?: IArtLocation[];
}

export class Frame extends RegEntry<EntryType.FRAME, IFrameData> {
    ID!: string;
    LicenseLevel!: number;
    Source!: string;
    Name!: string;
     MechType!: Array<string | MechType>;  // Typically mostly MechType
     YPosition!: number;
     Description!: string;
     Mounts!: MountType[];
     Traits!: FrameTrait[];
     CoreSystem!: CoreSystem;
     Stats!: IFrameStats;
    OtherArt!: IArtLocation[];
     ImageUrl!: string | null;

    protected async load(frameData: IFrameData): Promise<void> {
        this.ID = frameData.id;
        this.LicenseLevel = frameData.license_level;
        this.Source = frameData.source;
        this.Name = frameData.name;
        this.MechType = frameData.mechtype;
        this.YPosition = frameData.y_pos || 30;
        this.Mounts = frameData.mounts;
        this.Stats = frameData.stats;
        this.Traits = frameData.traits.map(x => new FrameTrait(x));
        this.CoreSystem = new CoreSystem(frameData.core_system);
        this.ImageUrl = frameData.image_url || null;
        this.OtherArt = frameData.other_art || [];
    }

    public async save(): Promise<IFrameData> {
        return {
            id: this.ID,
            license_level: this.LicenseLevel ,
            source: this.Source ,
            name: this.Name ,
            mechtype: this.MechType ,
            y_pos: this.YPosition ,
            mounts: Mounts ,
            stats: Stats ,
            traits: this.Traits.map(x => x.save()),
            core_system: this.CoreSystem.save() ,
            image_url: this.ImageUrl  ?? undefined,
            other_art: this.OtherArt ,
        }
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
}
