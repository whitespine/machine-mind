import { defaults } from "@src/funcs";
import { EntryType, OpCtx, RegEntry, Registry, SimSer } from "@src/registry";
import { merge_defaults } from "../default_entries";

interface AllFactionData {
    name: string;
    description: string;
    logo: string;
    color: string;
    logo_url?: string;
}

export interface PackedFactionData extends AllFactionData {
    id: string;
}

export interface RegFactionData extends Required<AllFactionData> {
    lid: string;
}

export class Faction extends RegEntry<EntryType.FACTION> {
    LID!: string;
    Name!: string;
    Description!: string;
    Logo!: string;
    LogoURL!: string;
    Color!: string;

    public static async unpack(
        data: PackedFactionData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<Faction> {
        let fdata: RegFactionData = merge_defaults(
            {
                lid: data.id,
                color: data.color,
                description: data.description,
                logo: data.logo,
                logo_url: data.logo_url,
                name: data.name,
            },
            defaults.FACTION()
        );
        return reg.get_cat(EntryType.FACTION).create_live(ctx, fdata);
    }

    public async load(data: RegFactionData): Promise<void> {
        merge_defaults(data, defaults.FACTION());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Logo = data.logo;
        this.LogoURL = data.logo_url;
        this.Color = data.color;
    }

    protected save_imp(): RegFactionData {
        return {
            lid: this.LID,
            name: this.Name,
            description: this.Description,
            logo: this.Logo,
            color: this.Color,
            logo_url: this.LogoURL,
        };
    }

    public async emit(): Promise<PackedFactionData> {
        return {
            color: this.Color,
            description: this.Description,
            id: this.LID,
            logo: this.Logo,
            name: this.Name,
            logo_url: this.LogoURL,
        };
    }
}
