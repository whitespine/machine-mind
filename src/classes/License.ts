import { EntryType, LiveEntryTypes, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@/registry";
import { Manufacturer } from './Manufacturer';

export type LicensedItemType =
    | EntryType.FRAME
    | EntryType.MECH_WEAPON
    | EntryType.MECH_SYSTEM
    | EntryType.WEAPON_MOD;
export type LicensedItem = LiveEntryTypes<LicensedItemType>;

export interface RegLicenseData {
    // Whaat's it called
    name: string;

    // Who made it
    manufacturer: RegRef<EntryType.MANUFACTURER>;

    // What does it unlock? NOTE: These should generally point to "compendium" copies, not user owned. Haven't quite figured out the logistics on that bitty yet
    unlocks: Array<Array<RegRef<LicensedItemType>>>;

    // If user owned, what rank is it? If not user owned, this should just be zero
    rank: number;
}

export class License extends RegEntry<EntryType.LICENSE, RegLicenseData> {
    Name!: string;
    Manufacturer!: Manufacturer; // This should never really be null, but it is good to be cognizant of the possibility
    Unlocks!: Array<Array<LicensedItem>>;
    Rank!: number;

    protected async load(data: RegLicenseData): Promise<void> {
        this.Name = name;
        this.Manufacturer = await this.Registry.resolve(data.manufacturer) ?? (await this.Registry.get_cat(EntryType.MANUFACTURER).lookup_mmid("GMS"))!;
        this.Rank = data.rank;
        this.Unlocks = [];
        for(let uarr of data.unlocks) {
            let resolved = await this.Registry.resolve_many(uarr);
            this.Unlocks.push(resolved);
        }
    }

    public async save(): Promise<RegLicenseData> {
        let unlocks: RegRef<LicensedItemType>[][] = [];
        for(let uarr of this.Unlocks) {
            let urow = SerUtil.ref_all(uarr);
            unlocks.push(urow);
        }
        return {
            name: this.Name,
            manufacturer: this.Manufacturer.as_ref(),
            rank: this.Rank,
            unlocks: this.Unlocks.map(uarr => SerUtil.ref_all(uarr))
        }
    }

    public static async unpack(license_name: string, reg: Registry): Promise<License> {
        // Get every possibility
        let all_licensed_items: LicensedItem[] = [
            ...await reg.get_cat(EntryType.MECH_WEAPON).list_live(),
            ...await reg.get_cat(EntryType.MECH_SYSTEM).list_live(),
            ...await reg.get_cat(EntryType.FRAME).list_live(),
            ...await reg.get_cat(EntryType.WEAPON_MOD).list_live(),
        ];

        // Cull to those with the desired license name
        all_licensed_items = all_licensed_items.filter(i => i.License == license_name);

        // Group into ranks
        let grouped: LicensedItem[][] = [];
        let i = 0;
        let manufacturer_name = "";
        while(all_licensed_items.length) {
            // Collect and remove all items of the current rank (i), then continue
            let of_rank = all_licensed_items.filter(x => x.LicenseLevel <= i || Number.isNaN(x.LicenseLevel)); // A stupid edge case but better to nip it here
            all_licensed_items = all_licensed_items.filter(x => x.LicenseLevel > i);

            // See if we can find a manufacturer
            for(let x of of_rank) {
                manufacturer_name = manufacturer_name || x.Source;
            }

            // Keep going until you
            grouped.push(of_rank);
            i++;
        }

        // Lookup the manufacturer
        let manufacturer = (await reg.get_cat(EntryType.MANUFACTURER).lookup_mmid(manufacturer_name))?.as_ref()!;

        let rdata: RegLicenseData = {
            name: license_name,
            manufacturer,
            rank: 1,
            unlocks: grouped.map(g => SerUtil.ref_all(g))
        }

        return reg.get_cat(EntryType.LICENSE).create(rdata);
    }

    public get UnlockedItems(): LicensedItem[] {
        let result: LicensedItem[] = [];
        for (let i = 0; i <= this.Rank; i++) {
            if (this.Unlocks[i]) {
                result.push(...this.Unlocks[i]);
            }
        }
        return result;
    }

}
