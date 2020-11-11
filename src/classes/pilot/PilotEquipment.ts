import { Action, Bonus, Damage, Deployable, Synergy, TagInstance, Range } from "@src/class";
import {
    IActionData,
    IBonusData,
    IRangeData,
    ISynergyData,
    PackedDamageData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegTagInstanceData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { RegDamageData } from "../Damage";

///////////////////////////////////////////////////////////
// Data
///////////////////////////////////////////////////////////
export type RegPilotEquipmentData = RegPilotArmorData | RegPilotWeaponData | RegPilotGearData;
export type PackedPilotEquipmentData =
    | PackedPilotWeaponData
    | PackedPilotArmorData
    | PackedPilotGearData;
export type PilotEquipment = PilotWeapon | PilotArmor | PilotGear;

interface AllPackedData {
    id: string;
    name: string; // v-html
    description: string;
    range: IRangeData[];
    actions?: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];
    deployables?: PackedDeployableData[];
    tags?: PackedTagInstanceData[];
}

export interface PackedPilotWeaponData extends AllPackedData {
    type: "Weapon";
    damage: PackedDamageData[];
    range: IRangeData[];
}
export interface PackedPilotGearData extends AllPackedData {
    type: "Gear";
}

export interface PackedPilotArmorData extends AllPackedData {
    type: "Armor";
}

// Reg items

interface AllRegData {
    id: string;
    name: string; // v-html
    description: string;
    actions: IActionData[]; // these are only available to UNMOUNTED pilots
    bonuses: IBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies: ISynergyData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    tags: RegTagInstanceData[];
}

export interface RegPilotWeaponData extends AllRegData {
    damage: RegDamageData[];
    range: IRangeData[];
}

export interface RegPilotArmorData extends AllRegData {}

export interface RegPilotGearData extends AllRegData {}

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export class PilotArmor extends RegEntry<EntryType.PILOT_ARMOR, RegPilotArmorData> {
    ID!: string;
    Name!: string;
    Description!: string;
    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];

    public async load(data: RegPilotArmorData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);

        await SerUtil.load_basd(this.Registry, data, this);
    }

    public async save(): Promise<RegPilotArmorData> {
        return {
            description: this.Description,
            id: this.ID,
            name: this.Name,
            tags: await SerUtil.save_all(this.Tags),
            ...(await SerUtil.save_commons(this)),
        };
    }

    public static async unpack(data: PackedPilotArmorData, reg: Registry, ctx: OpCtx): Promise<PilotArmor> {
        let rdata: RegPilotArmorData = {
            ...data,
            ...(await SerUtil.unpack_commons_and_tags(data, reg, ctx)),
        };
        return reg.get_cat(EntryType.PILOT_ARMOR).create(ctx, rdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables];
    }
}

export class PilotGear extends RegEntry<EntryType.PILOT_GEAR, RegPilotGearData> {
    ID!: string;
    Name!: string;
    Description!: string;
    Tags!: TagInstance[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots

    public async load(data: RegPilotGearData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);

        await SerUtil.load_basd(this.Registry, data, this);
    }

    public async save(): Promise<RegPilotGearData> {
        return {
            description: this.Description,
            id: this.ID,
            name: this.Name,
            tags: await SerUtil.save_all(this.Tags),
            ...(await SerUtil.save_commons(this)),
        };
    }

    public static async unpack(data: PackedPilotGearData, reg: Registry, ctx: OpCtx): Promise<PilotGear> {
        let rdata: RegPilotGearData = {
            ...data,
            ...(await SerUtil.unpack_commons_and_tags(data, reg, ctx)),
        };
        return reg.get_cat(EntryType.PILOT_GEAR).create(ctx, rdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables];
    }
}

export class PilotWeapon extends RegEntry<EntryType.PILOT_WEAPON, RegPilotWeaponData> {
    Name!: string;
    ID!: string;
    Description!: string;
    Effect!: string;
    Tags!: TagInstance[];
    Range!: Range[];
    Damage!: Damage[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots

    public async load(data: RegPilotWeaponData): Promise<void> {
        this.ID = data.id;
        this.Name = data.name;
        this.Description = data.description;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Damage = SerUtil.process_damages(data.damage);
        this.Range = SerUtil.process_ranges(data.range);
        await SerUtil.load_basd(this.Registry, data, this);
    }

    public async save(): Promise<RegPilotWeaponData> {
        return {
            id: this.ID,
            description: this.Description,
            name: this.Name,
            damage: SerUtil.sync_save_all(this.Damage),
            range: SerUtil.sync_save_all(this.Range),
            tags: await SerUtil.save_all(this.Tags),
            ...(await SerUtil.save_commons(this)),
        };
    }

    public static async unpack(data: PackedPilotWeaponData, reg: Registry, ctx: OpCtx): Promise<PilotWeapon> {
        let rdata: RegPilotWeaponData = {
            ...data,
            ...(await SerUtil.unpack_commons_and_tags(data, reg, ctx)),
            damage: data.damage.map(d => Damage.unpack(d)),
            range: data.range,
        };
        return reg.get_cat(EntryType.PILOT_WEAPON).create(ctx, rdata);
    }

    public get_child_entries(): RegEntry<any, any>[] {
        return [...this.Deployables];
    }
}
