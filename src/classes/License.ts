import { defaults } from '@src/funcs';
import { EntryType, LiveEntryTypes, OpCtx, quick_mm_ref, RegEntry, Registry, RegRef, RegSer, SerUtil } from "@src/registry";
import { createDecipher } from 'crypto';
import { Manufacturer } from "./Manufacturer";
import { Frame } from './mech/Frame';

export type LicensedItemType =
    | EntryType.FRAME
    | EntryType.MECH_WEAPON
    | EntryType.MECH_SYSTEM
    | EntryType.WEAPON_MOD;
export type LicensedItem = LiveEntryTypes<LicensedItemType>;

export interface RegLicenseData {
    // What's it called
    name: string;

    // Who made it
    manufacturer: RegRef<EntryType.MANUFACTURER> | null;

    // What does it unlock? NOTE: These should generally point to "compendium" copies, not user owned. Haven't quite figured out the logistics on that bitty yet
    unlocks: Array<Array<RegRef<LicensedItemType>>>;

    // If user owned, what rank is it? If not user owned, this should just be zero
    rank: number;
}

export class License extends RegEntry<EntryType.LICENSE> {
    Name!: string;
    Manufacturer!: Manufacturer | null; // This hopefully never really be null, but it is good to be cognizant of the possibility
    Unlocks!: Array<Array<LicensedItem>>;
    CurrentRank!: number;

    public get AllUnlocks(): LicensedItem[] {
        return this.Unlocks.flat();
    }

    public async load(data: RegLicenseData): Promise<void> {
        data = {...defaults.LICENSE(), ...data};
        this.Name = data.name;
        this.Manufacturer = null;
        if(data.manufacturer) {
            this.Manufacturer = await this.Registry.resolve(this.OpCtx, data.manufacturer);
        }
        this.CurrentRank = data.rank;
        this.Unlocks = [];
        for (let uarr of data.unlocks) {
            let resolved = await this.Registry.resolve_many(this.OpCtx, uarr);
            this.Unlocks.push(resolved);
        }
    }

    public async save(): Promise<RegLicenseData> {
        let unlocks: RegRef<LicensedItemType>[][] = [];
        for (let uarr of this.Unlocks) {
            let urow = SerUtil.ref_all(uarr);
            unlocks.push(urow);
        }
        return {
            name: this.Name,
            manufacturer: this.Manufacturer?.as_ref() || null,
            rank: this.CurrentRank,
            unlocks: this.Unlocks.map(uarr => SerUtil.ref_all(uarr)),
        };
    }


    // TODO: this remains to be clarified once beef decides on how to handle alt frames
    public static async unpack(license_name: string, reg: Registry, ctx: OpCtx): Promise<License[]> {
        // Get every possibility
        let all_licensed_items: LicensedItem[] = [
            ...(await reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx)),
            ...(await reg.get_cat(EntryType.MECH_SYSTEM).list_live(ctx)),
            ...(await reg.get_cat(EntryType.FRAME).list_live(ctx)),
            ...(await reg.get_cat(EntryType.WEAPON_MOD).list_live(ctx)),
        ];

        // Cull to those with the desired license name
        all_licensed_items = all_licensed_items.filter(i => i.License == license_name);

        // Get the individual frames - this handles the alt frame case
        let frames: Array<Frame | null> = all_licensed_items.filter(x => x instanceof Frame) as Frame[];
        if(frames.length == 0) {
            frames = [null]; // Default to license name for mechless licenses
        }

        // Make a unique license for each frame
        let licenses: License[] = [];
        for(let frame of frames) {
            // Copy items, filtering out "bad" mechs
            let frame_id = frame?.ID ?? license_name;
            let sub_licensed_items = all_licensed_items.filter(f => f instanceof Frame ? f.ID == frame_id : true);

            // Group into ranks
            let grouped: LicensedItem[][] = [];
            let i = 0;
            while (sub_licensed_items.length) {
                // Collect and remove all items of the current rank (i), then continue
                let of_rank = sub_licensed_items.filter(
                    x => x.LicenseLevel <= i || Number.isNaN(x.LicenseLevel)
                ); // A stupid edge case but better to nip it here
                sub_licensed_items = sub_licensed_items.filter(x => x.LicenseLevel > i);

                // Keep going until out of items
                grouped.push(of_rank);
                i++;
            }

            let rdata: RegLicenseData = {
                name: frame?.Name ?? license_name,
                manufacturer: frame?.Source?.as_ref() ?? null,
                rank: 1,
                unlocks: grouped.map(g => SerUtil.ref_all(g)),
            };
            let created = await reg.get_cat(EntryType.LICENSE).create(ctx, rdata);
            licenses.push(created);
        }

        return licenses;
    }

    public get UnlockedItems(): LicensedItem[] {
        let result: LicensedItem[] = [];
        for (let i = 0; i <= this.CurrentRank; i++) {
            if (this.Unlocks[i]) {
                result.push(...this.Unlocks[i]);
            }
        }
        return result;
    }

    // TODO: This might lead to double-reffing
    public get_child_entries(): RegEntry<any>[] {
        return this.Unlocks.flat();
    }
}
