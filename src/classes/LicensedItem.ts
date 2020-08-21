import { CompendiumItem, ItemType, Manufacturer, Pilot, License } from "@/class";
import { ICompendiumItemData } from "@/interface";
import { store } from "@/hooks";
import _ from "lodash";

export interface ILicensedItemData extends ICompendiumItemData {
    source: string;
    license: string;
    license_level: number;
}

// these items are unlocked via pilots ranking up in a specific frame license
export abstract class LicensedItem extends CompendiumItem {
    private _source: string;
    private _license: string;
    private _license_level: number;

    public constructor(itemData: ILicensedItemData) {
        super(itemData);
        this._source = itemData.source || "";
        this._license = itemData.license || "";
        this._license_level = itemData.license_level || 0;
    }

    public get Source(): string {
        return this._source.toUpperCase();
    }

    public get Manufacturer(): Manufacturer {
        return store.compendium.getReferenceByID("Manufacturers", this.Source);
    }

    public get License(): string {
        return this.ItemType === ItemType.Frame ? this.Name : this._license;
    }

    public get LicenseLevel(): number {
        return this._license_level;
    }

    public get LicenseString(): string {
        if (this._license) return `${this._license} ${this._license_level}`;
        return this._source;
    }
}

// Represents the specific licenses of a mech
export interface ILicenseRequirement {
    license: License; // The license it comes from
    rank: number; // The rank of that license
    items: string[]; // The items used in that license
    missing?: boolean | null; // When displaying, whether this license is present
}

// Utility class to check if all requirements are satisfied
export class LicensedRequirementBuilder {
    // Our resulting array, so far
    requirements: ILicenseRequirement[] = [];

    add_item(item: LicensedItem): LicensedRequirementBuilder {
        // Get what license we think it came from
        let found_license = store.compendium.getReferenceByID("Licenses", item.License);

        // Try and fine one
        let existing: ILicenseRequirement | null =
            this.requirements.find(
                req => req.license.Name == item.License && req.rank === item.LicenseLevel
            ) || null;
        if (!existing) {
            existing = {
                items: [],
                license: found_license,
                rank: item.LicenseLevel,
                missing: null,
            };
        }

        return this;
    }

    // Returns as_requirement_list but with missing filled in
    check_satisfied(for_pilot: Pilot) {
        let requirements = [...this.requirements];

        // Iterate over each requirement
        for (let r of requirements) {
            let satisfied = for_pilot.has(r.license, r.rank);
            r.missing = !satisfied;
        }
        return requirements;
    }
}
