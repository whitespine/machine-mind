import { defaults } from "@src/funcs";
import { imageManagement, ImageTag } from "@src/hooks";
import { EntryType, OpCtx, RegEntry, Registry, SimSer } from "@src/registry";
import { merge_defaults } from "./default_entries";

interface AllManufacturerData {
    name: string;
    logo: string;
    light: string;
    description: string;
    dark: string;
    quote: string;
    logo_url?: string;
}
export interface PackedManufacturerData extends AllManufacturerData {
    id: string;
}

export interface RegManufacturerData extends Required<AllManufacturerData> {
    lid: string;
}
export class Manufacturer extends RegEntry<EntryType.MANUFACTURER> {
    LID!: string;
    Name!: string;
    Description!: string;
    Logo!: string;
    LogoURL!: string;
    Light!: string;
    Dark!: string;
    Quote!: string;

    public async load(data: RegManufacturerData): Promise<void> {
        merge_defaults(data, defaults.MANUFACTURER());
        this.LID = data.lid;
        this.Name = data.name;
        this.Light = data.light;
        this.Dark = data.dark;
        this.Quote = data.quote;
        this.Description = data.description;
        this.Logo = data.logo;
        this.LogoURL = data.logo_url;
    }
    protected save_imp(): RegManufacturerData {
        return {
            lid: this.LID,
            name: this.Name,
            logo: this.Logo,
            light: this.Light,
            dark: this.Dark,
            quote: this.Quote,
            description: this.Description,
            logo_url: this.LogoURL,
        };
    }

    public static async unpack(
        pmd: PackedManufacturerData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Manufacturer> {
        return reg.get_cat(EntryType.MANUFACTURER).create_live(
            ctx,
            merge_defaults(
                {
                    lid: pmd.id,
                    dark: pmd.dark,
                    description: pmd.description,
                    light: pmd.light,
                    logo: pmd.logo,
                    name: pmd.name,
                    quote: pmd.quote,
                },
                defaults.MANUFACTURER()
            )
        );
    }

    public GetColor(dark?: boolean): string {
        return dark ? this.Dark : this.Light;
    }

    public async emit(): Promise<PackedManufacturerData> {
        return {
            dark: this.Dark,
            description: this.Description,
            id: this.LID,
            light: this.Light,
            logo: this.Logo,
            name: this.Name,
            quote: this.Quote,
            logo_url: this.Logo,
        };
    }
}
