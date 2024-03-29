import { Deployable, Synergy, Bonus, Action, TagInstance, Counter, Manufacturer } from "@src/class";
import { defaults, limited_max } from "@src/funcs";
import {
    RegActionData,
    PackedActionData,
    RegBonusData,
    PackedBonusData,
    ISynergyData,
    PackedCounterData,
    PackedDeployableData,
    PackedTagInstanceData,
    RegCounterData,
    RegDeployableData,
    RegTagInstanceData,
} from "@src/interface";
import {
    EntryType,
    OpCtx,
    quick_local_ref,
    RegEntry,
    Registry,
    RegRef,
    SerUtil,
} from "@src/registry";
import { SystemType } from "@src/enums";
import { merge_defaults } from "../default_entries";

interface AllMechSystemData {
    name: string;
    license: string; // reference to the Frame name of the associated license
    license_level: number; // set to zero for this item to be available to a LL0 character
    type?: SystemType;
    sp: number;
    description: string; // v-html
    effect: string; // v-html
    synergies?: ISynergyData[];
}

export interface PackedMechSystemData extends AllMechSystemData {
    id: string;
    deployables?: PackedDeployableData[];
    integrated?: string[];
    counters?: PackedCounterData[];
    bonuses?: PackedBonusData[];
    actions?: PackedActionData[];
    tags?: PackedTagInstanceData[];
    source: string; // must be the same as the Manufacturer ID to sort correctly
}

export interface RegMechSystemData extends Required<AllMechSystemData> {
    lid: string;
    bonuses: RegBonusData[];
    deployables: RegRef<EntryType.DEPLOYABLE>[];
    integrated: RegRef<any>[];
    counters: RegCounterData[];
    actions: RegActionData[];
    tags: RegTagInstanceData[];
    source: RegRef<EntryType.MANUFACTURER> | null;

    // We also save the active state
    cascading: boolean;
    destroyed: boolean;
    uses: number;
}

export class MechSystem extends RegEntry<EntryType.MECH_SYSTEM> {
    // System information
    LID!: string;
    Name!: string;
    Source!: Manufacturer | null;
    SysType!: SystemType;
    License!: string;
    LicenseLevel!: number;
    SP!: number;
    Description!: string;
    Effect!: string;

    // Commonalities
    Tags!: TagInstance[];
    Actions!: Action[];
    Bonuses!: Bonus[];
    Counters!: Counter[];
    Synergies!: Synergy[];
    Deployables!: Deployable[];
    Integrated!: RegEntry<any>[];

    // More system specific stuff
    Destroyed!: boolean;
    Cascading!: boolean;
    // Loaded!: boolean  // is this needed?
    // Current uses
    Uses!: number;

    /*
    // Is this mod an AI?
    get IsAI(): boolean {
        return is_ai(this);
    }

    // Is it destructible?
    get IsIndestructible(): boolean {
        return tag_util.is_indestructible(this);
    }

    // Is it loading?
    get IsLoading(): boolean {
        return tag_util.is_loading(this);
    }

    // Is it unique?
    get IsUnique(): boolean {
        return tag_util.is_unique(this);
    }
    */

    // Returns the base max uses
    get BaseLimit(): number | null {
        return limited_max(this);
    }

    public async load(data: RegMechSystemData): Promise<void> {
        merge_defaults(data, defaults.MECH_SYSTEM());
        this.LID = data.lid;
        this.Name = data.name;
        this.Source = data.source
            ? await this.Registry.resolve(this.OpCtx, data.source, { wait_ctx_ready: false })
            : null;
        this.SysType = data.type;
        this.License = data.license;
        this.LicenseLevel = data.license_level;
        this.SP = data.sp;
        this.Description = data.description;
        this.Effect = data.effect;

        this.Cascading = data.cascading;
        this.Destroyed = data.destroyed;
        this.Uses = data.uses;

        await SerUtil.load_basd(this.Registry, data, this, this.Name);
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.Counters = data.counters.map(c => new Counter(c));
        this.Integrated = await this.Registry.resolve_many(this.OpCtx, data.integrated, {
            wait_ctx_ready: false,
        });
    }

    protected save_imp(): RegMechSystemData {
        return {
            description: this.Description,
            effect: this.Effect,
            lid: this.LID,
            name: this.Name,
            source: this.Source?.as_ref() ?? null,
            license: this.License,
            license_level: this.LicenseLevel,
            sp: this.SP,
            type: this.SysType,

            cascading: this.Cascading,
            destroyed: this.Destroyed,
            uses: this.Uses,

            tags: SerUtil.save_all(this.Tags),
            counters: SerUtil.save_all(this.Counters),
            integrated: SerUtil.ref_all(this.Integrated),
            ...SerUtil.save_commons(this),
        };
    }

    public static async unpack(
        data: PackedMechSystemData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<MechSystem> {
        let rdata: RegMechSystemData = merge_defaults(
            {
                name: data.name,
                sp: data.sp,
                effect: data.effect,
                license: data.license,
                license_level: data.license_level,
                description: data.description,
                ...(await SerUtil.unpack_basdt(data, reg, ctx)),
                lid: data.id,
                source: quick_local_ref(reg, EntryType.MANUFACTURER, data.source),
                integrated: SerUtil.unpack_integrated_refs(reg, data.integrated),
                counters: SerUtil.unpack_counters_default(data.counters),
            },
            defaults.MECH_SYSTEM()
        );

        return reg.get_cat(EntryType.MECH_SYSTEM).create_live(ctx, rdata);
    }

    public get_assoc_entries(): RegEntry<any>[] {
        return [...this.Deployables, ...this.Integrated];
    }

    public async emit(): Promise<PackedMechSystemData> {
        return {
            id: this.LID,
            name: this.Name,
            description: this.Description,

            effect: this.Effect,
            license: this.License,
            license_level: this.LicenseLevel,
            sp: this.SP,
            type: this.SysType,

            source: this.Source?.LID ?? "GMS",
            actions: await SerUtil.emit_all(this.Actions),
            bonuses: await SerUtil.emit_all(this.Bonuses),
            counters: await SerUtil.emit_all(this.Counters),
            deployables: await SerUtil.emit_all(this.Deployables),
            tags: await SerUtil.emit_all(this.Tags),
            synergies: await SerUtil.emit_all(this.Synergies),
            integrated: this.Integrated.map(i => (i as any).LID ?? ""),
        };
    }
}
