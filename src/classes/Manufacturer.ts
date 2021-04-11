import { defaults } from "@src/funcs";
import { imageManagement, ImageTag } from "@src/hooks";
import { EntryType, OpCtx, RegEntry, Registry, SimSer } from "@src/registry";

interface AllManufacturerData {
    name: string;
    logo: string;
    light: string;
    description: string;
    dark: string;
    quote: string;
}
export interface PackedManufacturerData extends AllManufacturerData {
    id: string;
    logo_url?: string;
}

export interface RegManufacturerData extends AllManufacturerData {
    lid: string;
}
export class Manufacturer extends RegEntry<EntryType.MANUFACTURER> {
    LID!: string;
    Name!: string;
    Description!: string;
    Logo!: string;
    Light!: string;
    Dark!: string;
    Quote!: string;

    public async load(data: RegManufacturerData): Promise<void> {
        data = { ...defaults.MANUFACTURER(), ...data };
        this.LID = data.lid;
        this.Name = data.name;
        this.Light = data.light;
        this.Dark = data.dark;
        this.Quote = data.quote;
        this.Description = data.description;
        this.Logo = data.logo;
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
        };
    }

    public static async unpack(
        pmd: PackedManufacturerData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Manufacturer> {
        return reg.get_cat(EntryType.MANUFACTURER).create_live(ctx, {
            ...pmd,
            lid: pmd.id,
        });
    }

    public GetColor(dark?: boolean): string {
        return dark ? this.Dark : this.Light;
    }
}
