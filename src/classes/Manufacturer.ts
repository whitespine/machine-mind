import { defaults } from "@src/funcs";
import { imageManagement, ImageTag } from "@src/hooks";
import { EntryType, OpCtx, RegEntry, Registry, SimSer } from "@src/registry";

export interface PackedManufacturerData {
    id: string;
    name: string;
    logo: string;
    logo_url?: string;
    light: string;
    description: string;
    dark: string;
    quote: string;
}

export type RegManufacturerData = Omit<PackedManufacturerData, "logo_url">;

export class Manufacturer extends RegEntry<EntryType.MANUFACTURER> {
    ID!: string;
    Name!: string;
    Description!: string;
    Logo!: string;
    Light!: string;
    Dark!: string;
    Quote!: string;

    public async load(data: RegManufacturerData): Promise<void> {
        data = { ...defaults.MANUFACTURER(), ...data };
        this.ID = data.id;
        this.Name = data.name;
        this.Light = data.light;
        this.Dark = data.dark;
        this.Quote = data.quote;
        this.Description = data.description;
        this.Logo = data.logo;
    }
    protected save_imp(): RegManufacturerData {
        return {
            id: this.ID,
            name: this.Name,
            logo: this.Logo,
            light: this.Light,
            dark: this.Dark,
            quote: this.Quote,
            description: this.Description,
        };
    }

    public static async unpack(
        dep: PackedManufacturerData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Manufacturer> {
        return reg.get_cat(EntryType.MANUFACTURER).create_live(ctx, dep, true);
    }

    public GetColor(dark?: boolean): string {
        return dark ? this.Dark : this.Light;
    }
}
