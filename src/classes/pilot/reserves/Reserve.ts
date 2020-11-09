import { Synergy, MechEquipment, MechWeapon, MechSystem, Deployable, Counter } from "@src/class";
import { reserves } from "lancer-data";
import { IActionData, Action } from "@src/classes/Action";
import { IBonusData, Bonus } from "@src/classes/Bonus";
import { ISynergyData, PackedCounterData, RegCounterData, PackedDeployableData } from "@src/interface";
import { EntryType, RegEntry, Registry, RegRef, SerUtil, SimSer } from "@src/registry";
import { ReserveType } from "@src/classes/enums";

interface AllReserveData {
    id: string;
    type?: string;
    name?: string;
    label?: string;
    description?: string;
    resource_name: string;
    resource_note: string;
    resource_cost: string;
    used: boolean;
    consumable: boolean;
    actions?: IActionData[];
    bonuses?: IBonusData[];
    synergies?: ISynergyData[];
}
export interface PackedReserveData extends AllReserveData {
    deployables?: PackedDeployableData[];
    counters?: PackedCounterData[];
    integrated?: string[];
}

export interface RegReserveData extends Required<AllReserveData> {
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    counters: RegCounterData[];
    integrated: RegRef<any>[];
}

export class Reserve extends RegEntry<EntryType.RESERVE, RegReserveData> {
    ID!: string;
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
    Integrated!: RegEntry<any, any>[];
    Used!: boolean;

    public async load(data: RegReserveData) {
        this.ID = data.id;
        this.ResourceLabel = data.label;
        this.Consumable = data.consumable;
        this.ReserveType = (data.type as ReserveType) || ReserveType.Resources;
        this.Name = data.name;
        this.ResourceName = data.resource_name;
        this.ResourceNote = data.resource_note;
        this.ResourceCost = data.resource_cost;
        this.Description = data.description;
        this.Actions = data.actions.map(x => new Action(x));
        this.Bonuses = data.bonuses.map(x => new Bonus(x, `${this.ReserveType} - ${this.Name}`));
        this.Synergies = data.synergies.map(x => new Synergy(x));
        this.Deployables = await this.Registry.resolve_many(data.deployables);
        this.Counters = data.counters.map(c => new Counter(c));
        this.Integrated = await this.Registry.resolve_many(data.integrated);
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

    public async save(): Promise<RegReserveData> {
        return {
            id: this.ID,
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
            deployables: this.Deployables.map(d => d.as_ref()),
            integrated: this.Integrated.map(i => i.as_ref()),
            actions: this.Actions.map(a => a.save()),
            bonuses: this.Bonuses.map(b => b.save()),
            synergies: this.Synergies.map(s => s.save()),
        };
    }

    // Initializes self and all subsidiary items. DO NOT REPEATEDLY CALL LEST YE GET TONS OF DUPS
    static async unpack(res: PackedReserveData, reg: Registry): Promise<Reserve> {
        // Create deployable entries
        let dep_entries = await SerUtil.unpack_children(Deployable.unpack, reg, res.deployables);
        let deployables = SerUtil.ref_all(dep_entries);

        // Get integrated refs
        let integrated = SerUtil.unpack_integrated_refs(res.integrated || []);

        // Get the counters
        let counters = SerUtil.unpack_counters_default(res.counters);
        let rdata: RegReserveData = {
            ...res,
            integrated,
            deployables,
            counters,
            type: res.type ?? ReserveType.Resources,
            name: res.name ?? "New Reserve",
            label: res.label ?? "",
            description: res.description ?? "",
            actions: res.actions ?? [],
            bonuses: res.bonuses ?? [],
            synergies: res.synergies ?? [],
        };
        return reg.create(EntryType.RESERVE, rdata);
    }
}
