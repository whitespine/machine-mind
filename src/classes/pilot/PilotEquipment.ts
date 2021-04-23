import { Action, Bonus, Damage, Deployable, Synergy, TagInstance, Range } from "@src/class";
import { defaults, tag_util } from "@src/funcs";
import {
    PackedActionData,
    RegBonusData,
    PackedBonusData,
    RegRangeData,
    PackedRangeData,
    ISynergyData,
    PackedDamageData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegTagInstanceData,
    RegActionData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil } from "@src/registry";
import { RegDamageData } from "../Damage";
import { merge_defaults } from "../default_entries";

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
    actions?: PackedActionData[]; // these are only available to UNMOUNTED pilots
    bonuses?: PackedBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies?: ISynergyData[];
    deployables?: PackedDeployableData[];
    tags?: PackedTagInstanceData[];
}

export interface PackedPilotWeaponData extends AllPackedData {
    type: "Weapon";
    damage: PackedDamageData[];
    range: PackedRangeData[];
    effect?: string;
}
export interface PackedPilotGearData extends AllPackedData {
    type: "Gear";
}

export interface PackedPilotArmorData extends AllPackedData {
    type: "Armor";
}

// Reg items

interface AllRegData {
    lid: string;
    name: string; // v-html
    description: string;
    uses: number; // Remaining uses, if applicable
    actions: RegActionData[]; // these are only available to UNMOUNTED pilots
    bonuses: RegBonusData[]; // these bonuses are applied to the pilot, not parent system
    synergies: ISynergyData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    tags: RegTagInstanceData[];
}

export interface RegPilotWeaponData extends AllRegData {
    effect: string;
    damage: RegDamageData[];
    range: RegRangeData[];
    loaded: boolean;
}

export interface RegPilotArmorData extends AllRegData {}

export interface RegPilotGearData extends AllRegData {}

/////////////////////////////////////////////////////////
// Classes
/////////////////////////////////////////////////////////

export class PilotArmor extends RegEntry<EntryType.PILOT_ARMOR> {
    LID!: string;
    Name!: string;
    Description!: string;
    Uses!: number;
    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];

    get BaseLimit(): number | null {
        return tag_util.limited_max(this);
    }

    public async load(data: RegPilotArmorData): Promise<void> {
        merge_defaults(data, defaults.PILOT_ARMOR());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Uses = data.uses;

        await SerUtil.load_basd(this.Registry, data, this, this.Name);
    }

    protected save_imp(): RegPilotArmorData {
        return {
            description: this.Description,
            lid: this.LID,
            name: this.Name,
            tags: SerUtil.save_all(this.Tags),
            uses: this.Uses,
            ...SerUtil.save_commons(this),
        };
    }

    public static async unpack(
        data: PackedPilotArmorData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<PilotArmor> {
        let rdata: RegPilotArmorData = merge_defaults({
            name: data.name,
            description: data.description,
            lid: data.id,
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
        }, defaults.PILOT_ARMOR());
        return reg.get_cat(EntryType.PILOT_ARMOR).create_live(ctx, rdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables];
    }

    public async emit(): Promise<PackedPilotArmorData> {
        return {
            description: this.Description,
            id: this.LID,
            name: this.Name,
            type: "Armor",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            tags: await SerUtil.emit_all(this.Tags)
        }
    }
}

export class PilotGear extends RegEntry<EntryType.PILOT_GEAR> {
    LID!: string;
    Name!: string;
    Description!: string;
    Tags!: TagInstance[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots

    Uses!: number; // How many we got remaining. Max determined by tag
    // Returns the base max uses
    get BaseLimit(): number | null {
        return tag_util.limited_max(this);
    }

    public async load(data: RegPilotGearData): Promise<void> {
        merge_defaults(data, defaults.PILOT_GEAR());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Uses = data.uses;

        await SerUtil.load_basd(this.Registry, data, this, this.Name);
    }

    protected save_imp(): RegPilotGearData {
        return {
            description: this.Description,
            lid: this.LID,
            name: this.Name,
            tags: SerUtil.save_all(this.Tags),
            uses: this.Uses,
            ...SerUtil.save_commons(this),
        };
    }

    public static async unpack(
        data: PackedPilotGearData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<PilotGear> {
        let rdata: RegPilotGearData = merge_defaults({
            lid: data.id,
            name: data.name,
            description: data.description,
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
        }, defaults.PILOT_GEAR());
        return reg.get_cat(EntryType.PILOT_GEAR).create_live(ctx, rdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables];
    }

    public async emit(): Promise<PackedPilotGearData> {
        return {
            description: this.Description,
            id: this.LID,
            name: this.Name,
            type: "Gear",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            tags: await SerUtil.emit_all(this.Tags)
        }
    }
}

export class PilotWeapon extends RegEntry<EntryType.PILOT_WEAPON> {
    Name!: string;
    LID!: string;
    Description!: string;
    Effect!: string;
    Uses!: number;
    Loaded!: boolean;
    Tags!: TagInstance[];
    Range!: Range[];
    Damage!: Damage[];
    Actions!: Action[]; // these are only available to UNMOUNTED pilots
    Bonuses!: Bonus[]; // these bonuses are applied to the pilot, not parent system
    Synergies!: Synergy[];
    Deployables!: Deployable[]; // these are only available to UNMOUNTED pilots

    get BaseLimit(): number | null {
        return tag_util.limited_max(this);
    }

    public async load(data: RegPilotWeaponData): Promise<void> {
        merge_defaults(data, defaults.PILOT_LOADOUT());
        this.LID = data.lid;
        this.Name = data.name;
        this.Description = data.description;
        this.Effect = data.effect;
        this.Uses = data.uses;
        this.Loaded = data.loaded;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Damage = SerUtil.process_damages(data.damage);
        this.Range = SerUtil.process_ranges(data.range);
        await SerUtil.load_basd(this.Registry, data, this, this.Name);
    }

    protected save_imp(): RegPilotWeaponData {
        return {
            lid: this.LID,
            description: this.Description,
            name: this.Name,
            effect: this.Effect,
            uses: this.Uses,
            loaded: this.Loaded,
            damage: SerUtil.save_all(this.Damage),
            range: SerUtil.save_all(this.Range),
            tags: SerUtil.save_all(this.Tags),
            ...SerUtil.save_commons(this),
        };
    }

    public static async unpack(
        data: PackedPilotWeaponData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<PilotWeapon> {
        let rdata: RegPilotWeaponData = merge_defaults({
            name: data.name,
            effect: data.description,
            description: data.description,
            lid: data.id,
            damage: data.damage.map(d => Damage.unpack(d)),
            range: data.range.map(Range.unpack),
            ...(await SerUtil.unpack_basdt(data, reg, ctx)),
        }, defaults.PILOT_WEAPON());
        return reg.get_cat(EntryType.PILOT_WEAPON).create_live(ctx, rdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables];
    }

    public async emit(): Promise<PackedPilotWeaponData> {
        return {
            description: this.Description,
            id: this.LID,
            name: this.Name,
            type: "Weapon",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            tags: await SerUtil.emit_all(this.Tags),
            damage: await SerUtil.emit_all(this.Damage),
            range: await SerUtil.emit_all(this.Range),
            effect: this.Effect
        }
    }
}
