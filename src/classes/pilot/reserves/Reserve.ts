import { Synergy, MechEquipment, MechWeapon, MechSystem, Deployable, Counter, Action, Bonus } from "@src/class";
import {
    ISynergyData,
    PackedCounterData,
    RegCounterData,
    PackedDeployableData,
    PackedBonusData,
    PackedActionData,
    RegActionData,
    RegBonusData,
} from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, RegRef, SerUtil, SimSer } from "@src/registry";
import { ReserveType } from "@src/enums";
import { defaults } from "@src/funcs";
import { merge_defaults } from "@src/classes/default_entries";

interface AllReserveData {
    type?: string;
    name?: string;
    label?: string;
    description?: string;
    resource_name: string;
    resource_note: string;
    resource_cost: string;
    used: boolean;
    consumable: boolean;
    synergies?: ISynergyData[];
}
export interface PackedReserveData extends AllReserveData {
    id: string;
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
    bonuses?: PackedBonusData[];
    actions?: PackedActionData[];
}

export interface RegReserveData extends Required<AllReserveData> {
    lid: string;
    bonuses: RegBonusData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
    actions: RegActionData[];
}

export class Reserve extends RegEntry<EntryType.RESERVE> {
    LID!: string;
    ResourceLabel!: string;
    Consumable!: boolean;
    ReserveType!: ReserveType;
    Actions!: Action[];
    Bonuses!: Bonus[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Counters!: Counter[];
    Name!: string;
    ResourceName!: string;
    ResourceNote!: string;
    ResourceCost!: string;
    Description!: string;
    Integrated!: RegEntry<any>[];
    Used!: boolean;

    public async load(data: RegReserveData) {
        merge_defaults(data, defaults.RESERVE());
        this.LID = data.lid;
        this.ResourceLabel = data.label;
        this.Consumable = data.consumable;
        this.ReserveType = (data.type as ReserveType) || ReserveType.Resources;
        this.Name = data.name;
        this.ResourceName = data.resource_name;
        this.ResourceNote = data.resource_note;
        this.ResourceCost = data.resource_cost;
        this.Description = data.description;
        (this.Actions = SerUtil.process_actions(data.actions)),
            (this.Bonuses = SerUtil.process_bonuses(data.bonuses, this.Name)),
            (this.Synergies = data.synergies.map(x => new Synergy(x)));
        this.Deployables = await this.Registry.resolve_many(this.OpCtx, data.deployables, {
            wait_ctx_ready: false,
        });
        this.Counters = data.counters.map(c => new Counter(c));
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {
            wait_ctx_ready: false,
        });
        this.Used = data.used;
    }

    public get Icon(): string {
        if (this.ReserveType === ReserveType.Organization) return "mdi-account-group";
        if (this.ReserveType === ReserveType.Project) return "cci-orbital";
        return `cci-reserve-${this.ReserveType.toString().toLowerCase()}`;
    }

    public get IntegratedEquipment(): MechEquipment[] {
        return this.Integrated.filter(x =>
            [EntryType.MECH_SYSTEM, EntryType.MECH_WEAPON].includes(x.Type)
        ) as Array<MechWeapon | MechSystem>;
    }

    public get IntegratedWeapons(): MechWeapon[] {
        return this.Integrated.filter(x => EntryType.MECH_WEAPON == x.Type) as Array<MechWeapon>;
    }

    public get IntegratedSystems(): MechSystem[] {
        return this.Integrated.filter(x => EntryType.MECH_SYSTEM == x.Type) as Array<MechSystem>;
    }

    public get Color(): string {
        return this.Used ? "grey darken-1" : `reserve--${this.Type.toLowerCase()}`;
    }

    protected save_imp(): RegReserveData {
        return {
            lid: this.LID,
            type: this.Type,
            name: this.Name,
            label: this.ResourceLabel,
            description: this.Description,
            resource_name: this.ResourceName,
            resource_note: this.ResourceNote,
            resource_cost: this.ResourceCost,
            consumable: this.Consumable,
            used: this.Used,
            counters: this.Counters.map(c => c.save()),
            // deployables: this.Deployables.map(d => d.as_ref()),
            integrated: this.Integrated.map(i => i.as_ref()),
            // actions: this.Actions.map(a => a.save()),
            // bonuses: this.Bonuses.map(b => b.save()),
            // synergies: this.Synergies.map(s => s.save()),
            ...SerUtil.save_commons(this),
        };
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(data: PackedReserveData, reg: Registry, ctx: OpCtx): Promise<Reserve> {
        // Create deployable entries
        let dep_entries = await Promise.all(
            (data.deployables ?? []).map(i => Deployable.unpack(i, reg, ctx, data.id))
        );
        let deployables = SerUtil.ref_all(dep_entries);

        // Get integrated refs
        let integrated = SerUtil.unpack_integrated_refs(reg, data.integrated || []);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(data.counters);
        let rdata: RegReserveData = merge_defaults(
            {
                lid: data.id,
                consumable: data.consumable,
                description: data.description,
                label: data.label,
                name: data.name,
                resource_cost: data.resource_cost,
                resource_name: data.resource_name,
                resource_note: data.resource_note,
                type: data.type,
                used: data.used,
                bonuses: (data.bonuses ?? []).map(Bonus.unpack),
                actions: (data.actions ?? []).map(Action.unpack),
                synergies: data.synergies ?? [],
                integrated,
                deployables,
                counters,
            },
            defaults.RESERVE()
        );
        return reg.get_cat(EntryType.RESERVE).create_live(ctx, rdata);
    }

    public async emit(): Promise<PackedReserveData> {
        return {
            id: this.LID,
            name: this.Name,
            description: this.Description,
            consumable: this.Consumable,
            resource_cost: this.ResourceCost,
            resource_name: this.ResourceName,
            resource_note: this.ResourceNote,
            used: this.Used,
            label: this.ResourceLabel,
            type: this.ReserveType,

            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            counters: await SerUtil.emit_all(this.Counters),
            deployables: await SerUtil.emit_all(this.Deployables),
            synergies: await SerUtil.emit_all(this.Synergies),
            integrated: this.Integrated.map(i => (i as any).LID ?? ""),
        };
    }
}
