import { Frame, Manufacturer } from "@src/class";
import { defaults } from "@src/funcs";
import {
    EntryType,
    LiveEntryTypes,
    OpCtx,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { merge_defaults } from "../default_entries";

export type LicensedItemType =
    | EntryType.FRAME
    | EntryType.MECH_WEAPON
    | EntryType.MECH_SYSTEM
    | EntryType.WEAPON_MOD;
export type LicensedItem = LiveEntryTypes<LicensedItemType>;
// export type LicensedItem = RegEntry<LicensedItemType>;

export interface RegLicenseData {
    // Its internal identifier.
    lid: string;

    // What's it called (user facing)
    name: string;

    // What its called in item `License` fields
    key: string;

    // Who made it
    manufacturer: RegRef<EntryType.MANUFACTURER> | null;

    // If user owned, what rank is it? If not user owned, this should just be zero
    rank: number;
}

// The result of a license scanning a registry
export class LicenseScan {
    Registries: Registry[]; // The registries that we scanned
    AllItems: Array<LicensedItem>;
    ByLevel: Map<number, Array<LicensedItem>>;

    constructor(regs: Registry[], items: Array<LicensedItem>) {
        this.Registries = regs;
        this.AllItems = items;

        // Groups the results by id. Does not generate arrays for levels which have nothing
        this.ByLevel = new Map();
        for (let entry of this.AllItems) {
            // Find the existing array
            let arr = this.ByLevel.get(entry.LicenseLevel) ?? [];
            // Add the entry
            arr.push(entry);
            // Set the item in the map, if this is a new array
            if (arr.length == 1) {
                this.ByLevel.set(entry.LicenseLevel, arr);
            }
        }
    }

    // Lists all unlocked items up to the current level. Does not include negative LL items, which shouldn't really exist anyways
    Unlocked(for_level: number): Array<LicensedItem> {
        let result: LicensedItem[] = [];
        for (let i = 0; i <= for_level; i++) {
            let al = this.ByLevel.get(i);
            if (al) result.push(...al);
        }
        return result;
    }
}

// Licenses are a bit weird. They don't track specific items, and instead just provide mechanisms for searching registries for all equipment that falls under their license
// This can be expensive, so cache as appropriate to your context
export class License extends RegEntry<EntryType.LICENSE> {
    LID!: string;
    Name!: string; // The item's display name
    LicenseKey!: string; // This is what will be seen in the "License" field of licensed items. Looser than a regref, because the association is indirect/dynamic/many-many or whatever
    Source!: Manufacturer | null; // This hopefully never really be null, but it is good to be cognizant of the possibility
    CurrentRank!: number;

    // Scans all categories of the specified registry. Forces you to provide a ctx because otherwise this is ridiculously expensive for basically no reason
    public async scan(
        registries: Registry[],
        use_ctx: OpCtx,
        dedup_lids: boolean = true
    ): Promise<LicenseScan> {
        // Get every possibility from this registry
        let all_licensed_items: LicensedItem[] = [];
        for (let reg of registries) {
            all_licensed_items.push(
                ...(await reg.get_cat(EntryType.MECH_WEAPON).list_live(use_ctx)),
                ...(await reg.get_cat(EntryType.MECH_SYSTEM).list_live(use_ctx)),
                ...(await reg.get_cat(EntryType.FRAME).list_live(use_ctx)),
                ...(await reg.get_cat(EntryType.WEAPON_MOD).list_live(use_ctx))
            );
        }

        // Cull to those with the desired license name
        all_licensed_items = all_licensed_items.filter(i => i.License == this.LicenseKey);

        // Deduplicate LIDs
        if (dedup_lids) {
            let new_result: LicensedItem[] = [];
            for (let l of all_licensed_items) {
                if (!new_result.find(x => x.LID == l.LID)) {
                    new_result.push(l);
                }
            }
            all_licensed_items = new_result;
        }
        return new LicenseScan(registries, all_licensed_items);
    }

    public async load(data: RegLicenseData): Promise<void> {
        merge_defaults(data, defaults.LICENSE());
        this.LID = data.lid;
        this.Name = data.name;
        this.Source = null;
        this.CurrentRank = data.rank;
        this.LicenseKey = data.key;
        if (data.manufacturer) {
            this.Source = await this.Registry.resolve(this.OpCtx, data.manufacturer, {
                wait_ctx_ready: false,
            });
        }
    }

    protected save_imp(): RegLicenseData {
        return {
            lid: this.LID,
            name: this.Name,
            manufacturer: this.Source?.as_ref() || null,
            rank: this.CurrentRank,
            key: this.LicenseKey,
        };
    }

    public static async unpack(
        license_name: string,
        reg: Registry,
        ctx: OpCtx,
        man: Manufacturer | null
    ): Promise<License> {
        // Do an initial blank initialization
        let rdata: RegLicenseData = {
            lid: "lic_" + license_name.toLowerCase(),
            name: license_name,
            key: license_name,
            manufacturer: man?.as_ref() || null,
            rank: 1,
        };
        return reg.get_cat(EntryType.LICENSE).create_live(ctx, rdata);
    }

    public async emit(): Promise<null> {
        return null;
    }
}
