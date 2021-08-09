import { Counter, NpcClass, NpcClassStats, NpcFeature, NpcTemplate } from "@src/class";
import {
    INpcClassStats,
    INpcStatComposite,
    PackedCounterSaveData,
    RegCounterData,
} from "@src/interface";
import { EntryType, InventoriedRegEntry, RegEntry, Registry, SerUtil } from "@src/registry";
import { defaults } from "@src/funcs";
import { merge_defaults } from "../default_entries";
import {
    finding_iterate,
    fallback_obtain_ref,
    RegFallback,
    FALLBACK_WAS_INSINUATED,
} from "../regstack";
interface INpcItemSaveData {
    // unsure if we really need this
    itemID: string;
    tier: number;
    flavorName: string; // If user overrode name, it will be here
    description: string;
    destroyed: boolean;
    charged: boolean;
    uses: number;
}

interface AllNpcData {
    tier: number | string;
    name: string;
    subtitle: string; // Is the summary, really
    campaign: string;
    labels: string[];
    tag: string; // Vehicle, squad, etc
    note: string;
    side: string;
    cloudImage: string;
    localImage: string;
    burn: number;
    overshield: number;
    destroyed: boolean;
    defeat: string;
    resistances: string[];
}

export interface PackedNpcData extends AllNpcData {
    id: string;
    active: boolean;
    cc_ver: string;
    class: string;
    custom_counters: object[];
    counter_data: PackedCounterSaveData[];
    statuses: string[];
    conditions: string[];
    items: INpcItemSaveData[];
    templates: string[];
    actions: number;
    stats: INpcStatComposite;
    currentStats: INpcStatComposite; // exact usage unclear
    lastSync?: string | null;
}

export interface RegNpcData extends AllNpcData {
    lid: string;
    tier: number; // Custom tiering is handled on a per item basis
    custom_counters: RegCounterData[];
    hp: number;
    heat: number;
    stress: number;
    structure: number;
    // Other stuff held in inventory
}

export class Npc extends InventoriedRegEntry<EntryType.NPC> {
    // Held data
    LID!: string;
    Tier!: number;
    Name!: string;
    Summary!: string;
    Campaign!: string;
    Labels!: string[];
    Tag!: string;
    Note!: string;
    Side!: string;
    CloudImage!: string;
    LocalImage!: string;
    Burn!: number;
    CurrentHP!: number;
    CurrentHeat!: number;
    CurrentStructure!: number;
    CurrentStress!: number;
    Overshield!: number;
    Destroyed!: boolean;
    Defeat!: string;
    Resistances!: string[];
    CustomCounters!: Counter[];

    // Derived items
    private _features!: NpcFeature[];
    public get Features(): NpcFeature[] {
        return [...this._features];
    }

    private _templates!: NpcTemplate[];
    public get Templates(): NpcTemplate[] {
        return [...this._templates];
    }

    private _classes!: NpcClass[];
    public get Classes(): NpcClass[] {
        return [...this._classes];
    }

    protected enumerate_owned_items(): RegEntry<any>[] {
        return [...this._classes, ...this._features, ...this._templates];
    }

    // this._tag = this.Class.Role.toLowerCase() === "biological" ? "Biological" : "Mech";

    /*
    public get Power(): number {
        // TODO: calc stat power for custom
        const multiplier = typeof this.Tier === "number" ? this.Tier : 3.5;
        return (this.Class.Power + this.Templates.reduce((a, b) => +a + +b.Power, 0)) * multiplier;
    }
    */

    // We don't cache yet
    public recompute_bonuses() {}

    // Repopulate all of our cached inventory lists
    public async repopulate_inventory(): Promise<void> {
        let _opt = { wait_ctx_ready: false };
        let subreg = await this.get_inventory();
        this._features = await subreg.get_cat(EntryType.NPC_FEATURE).list_live(this.OpCtx, _opt);
        this._templates = await subreg.get_cat(EntryType.NPC_TEMPLATE).list_live(this.OpCtx, _opt);
        this._classes = await subreg.get_cat(EntryType.NPC_CLASS).list_live(this.OpCtx, _opt);
    }

    /* ------------- Class and feature filtering helpers ------------ */
    public get ActiveClass(): NpcClass | null {
        if (this.Classes.length) {
            return this.Classes[0];
        } else {
            return null;
        }
    }

    public get BaseClassFeatures(): NpcFeature[] {
        return this.Features.filter(f => f.Origin.type == "Class" && f.Origin.base);
    }

    public get BaseTemplateFeatures(): NpcFeature[] {
        return this.Features.filter(f => f.Origin.type == "Template" && f.Origin.base);
    }

    public get BaseFeatures(): NpcFeature[] {
        return this.BaseClassFeatures.concat(this.BaseTemplateFeatures);
    }

    public get SelectedClassFeatures(): NpcFeature[] {
        return this.Features.filter(f => f.Origin.type == "Class" && !f.Origin.base);
    }

    public get SelectedTemplateFeatures(): NpcFeature[] {
        return this.Features.filter(f => f.Origin.type == "Template" && !f.Origin.base);
    }

    /*
    public get AvailableFeatures(): NpcFeature[] {
        return this.Class.OptionalFeatures.concat(
            this._templates.flatMap(x => x.OptionalFeatures)
        ).filter(x => !this.SelectedFeatures.some(y => y.LID === x.LID));
    }
    */

    // get BaseStats!: INpcStats { return this.ActiveClass?.Stats ?? defaults.NPC_STATS
    // Computes stat by compiling the base[tier] + all bonuses OR override (first encountered)
    private stat<T extends keyof INpcClassStats>(key: T): number {
        let stat_base = this.ActiveClass ? this.ActiveClass.Stats : defaults.NPC_CLASS_STATS();
        let wrapped = new NpcClassStats(stat_base);
        let val = wrapped.Stat(key, this.Tier);

        // Apply bonuses/overrides
        for (let feature of this.Features) {
            let bonus = feature.Bonus[key];
            let override = feature.Override[key];
            if (override) {
                return override as number; // Decision to make this return immediately made purely on the example case of grunts
            }
            if (typeof bonus == "number") {
                val += bonus;
            }
        }
        return val;
    }

    // -- Encounter Management ----------------------------------------------------------------------
    public get MaxStructure(): number {
        return this.stat("structure");
    }

    public get MaxHP(): number {
        return this.stat("hp");
    }

    public get MaxStress(): number {
        return this.stat("stress");
    }

    public get HeatCapacity(): number {
        return this.stat("heatcap");
    }

    public get Activations(): number {
        return this.stat("activations");
    }

    public get Hull(): number {
        return this.stat("hull");
    }

    public get Agility(): number {
        return this.stat("agility");
    }

    public get Systems(): number {
        return this.stat("systems");
    }

    public get Engineering(): number {
        return this.stat("engineering");
    }

    public get SaveTarget(): number {
        return this.stat("save");
    }

    public get SensorRange(): number {
        return this.stat("sensor");
    }

    public get Armor(): number {
        return this.stat("armor");
    }

    public get Size(): number {
        let sz = this.stat("size");
        if (Array.isArray(sz)) {
            return sz[0];
        } else {
            return sz;
        }
    }

    public get Speed(): number {
        return this.stat("speed");
    }

    public get Evasion(): number {
        return this.stat("evade");
    }

    public get EDefense(): number {
        return this.stat("edef");
    }

    protected async load(data: RegNpcData): Promise<void> {
        merge_defaults(data, defaults.NPC());
        this.CustomCounters = SerUtil.process_counters(data.custom_counters);
        this.Tier = data.tier;
        this.Burn = data.burn;
        this.Campaign = data.campaign;
        this.CloudImage = data.cloudImage;
        this.Defeat = data.defeat;
        this.Destroyed = data.destroyed;
        this.LID = data.lid;
        this.CurrentHP = data.hp;
        this.CurrentHeat = data.heat;
        this.CurrentStress = data.stress;
        this.CurrentStructure = data.structure;
        this.Labels = data.labels;
        this.LocalImage = data.localImage;
        this.Name = data.name;
        this.Note = data.note;
        this.Overshield = data.overshield;
        this.Resistances = data.resistances;
        this.Side = data.side;
        this.Summary = data.subtitle;
        this.Tag = data.tag;
        await this.repopulate_inventory();
    }

    protected save_imp(): RegNpcData {
        return {
            custom_counters: SerUtil.save_all(this.CustomCounters),
            tier: this.Tier,
            burn: this.Burn,
            campaign: this.Campaign,
            cloudImage: this.CloudImage,
            defeat: this.Defeat,
            destroyed: this.Destroyed,
            lid: this.LID,
            hp: this.CurrentHP,
            heat: this.CurrentHeat,
            labels: this.Labels,
            localImage: this.LocalImage,
            name: this.Name,
            note: this.Note,
            overshield: this.Overshield,
            resistances: this.Resistances,
            side: this.Side,
            subtitle: this.Summary,
            tag: this.Tag,
            stress: this.CurrentStress,
            structure: this.CurrentStructure,
        };
    }

    public async emit(): Promise<PackedNpcData> {
        throw new TypeError("not yet implemented");
        /*
        return {
            actions: [],
            active: false,
            cc_ver: CC_VERSION,
            class: this.ActiveClass?.LID ?? "",
            conditions:  [],
            counter_data: [],
            currentStats: {
                activations: this.Activations,
                agility: this.Agility,
                armor: this.Armor,
                edef: thisJKJ
            },
        }
        */
    }
}

export async function npc_cloud_sync(
    data: PackedNpcData,
    npc: Npc,
    fallback_source_regs: Registry[]
    // hooks?: AllHooks,
): Promise<Npc> {
    // Refresh the pilot
    let tmp_npc = await npc.refreshed();
    if (!tmp_npc) {
        throw new Error("Npc was unable to be refreshed. May have been deleted"); // This is fairly catastrophic
    }
    npc = tmp_npc;
    let npc_inv = await tmp_npc.get_inventory();

    // Stub out pre-edit with a noop
    // hooks = hooks || {};

    // The simplest way to do this is to, for each entry, just look in a regstack and insinuate to the pilot inventory.
    // if the item was already in the pilot inventory, then no harm!. If not, it is added.
    let stack: RegFallback = {
        base: npc_inv,
        fallbacks: fallback_source_regs,
    };
    let ctx = npc.OpCtx;

    // Identity
    npc.LID = data.id;
    npc.Labels = data.labels;
    npc.Name = data.name;
    npc.Note = data.note;
    npc.Side = data.side;
    npc.Summary = data.subtitle;
    npc.Tag = data.tag;
    npc.Campaign = data.campaign;
    data.cc_ver;

    // Meta-combat info
    npc.Tier = Number.parseInt(data.tier.toString()) || 1;
    npc.Resistances = data.resistances;

    // Statuses and conditions
    // data.statuses;
    // data.conditions;
    // todo. Not like they do anything rn anyways

    // Current stats. Ignore most, as they will just be derived
    npc.Overshield = data.overshield;
    npc.Burn = data.burn;
    npc.CurrentHP = data.currentStats.hp;
    npc.CurrentHeat = data.currentStats.heatcap; // Not sure on this, but I think it is right, strange as it looks
    npc.CurrentStress = data.currentStats.stress ?? 1;
    npc.CurrentStructure = data.currentStats.structure ?? 1;

    // Counters
    for (let ctr of data.counter_data) {
        let corr = npc.CustomCounters.find(c => c.Name == ctr.id);
        if (!corr) {
            corr = new Counter({
                lid: ctr.id,
                name: ctr.id,
                default_value: 1,
                min: 0,
                max: 9999,
                val: ctr.val,
            });
            npc.CustomCounters.push(corr);
        } else {
            corr.Value = ctr.val;
        }
    }

    // Item pulling
    // Class
    let clazz = await fallback_obtain_ref(
        stack,
        ctx,
        {
            fallback_lid: data.class,
            id: "",
            type: EntryType.NPC_CLASS,
        },
        {}
    );

    // Npc class has no custom flavor compcon side. Just give a warning
    if (!clazz) {
        console.error("Couldn't find npc class: " + data.class);
    } else {
        // Destroy old class(es)
        for (let c of npc.Classes) {
            if (c.RegistryID != clazz.RegistryID) {
                await c.destroy_entry();
            }
        }
    }

    // Templates. Still no styling, but there are several
    for (let temp_id of data.templates) {
        let temp = await fallback_obtain_ref(
            stack,
            ctx,
            {
                fallback_lid: temp_id,
                id: "",
                type: EntryType.NPC_TEMPLATE,
            },
            {}
        );

        if (!temp) {
            console.error("Couldn't find npc template: " + temp_id);
        }
    }

    // Items. Have custom flavor and statuses to update
    for (let packed_item of data.items) {
        let item = await fallback_obtain_ref(
            stack,
            ctx,
            {
                fallback_lid: packed_item.itemID,
                id: "",
                type: EntryType.NPC_FEATURE,
            },
            {}
        );

        if (item) {
            // Set fields
            // Name is simple - override if present
            item.Name = packed_item.flavorName.trim() || item.Name;

            // Description is weird. If provided, we prefix the item effect with it IFF the effect doesn't already contain the description
            if (packed_item.description.trim() && !item.Effect.includes(packed_item.description)) {
                item.Effect = `<i>${packed_item.description}</i><br>${item.Effect}`;
            }

            // Set tier override iff the provided tier doesn't match
            let item_tier = Number.parseInt(packed_item.tier.toString()) || 0;
            if (item_tier != npc.Tier) {
                item.TierOverride = item_tier;
            } else {
                item.TierOverride = 0;
            }

            // Set charged/uses/destroyed no matter whaat
            item.Charged = packed_item.charged;
            item.Uses = packed_item.uses;
            item.Destroyed = packed_item.destroyed;

            // Save it
            await item.writeback();
        } else {
            console.error("Couldn't find npc feature: " + packed_item.itemID);
        }
    }

    // Everything else isn't used. Left here for safekeeping i guess
    // data.cloudImage;
    // data.custom_counters;
    // data.defeat;
    // data.destroyed;
    // data.lastSync;
    // data.localImage;
    // data.stats;

    // Save changes
    await npc.writeback();

    // Final refresh-check, just in case
    tmp_npc = await npc.refreshed();
    if (!tmp_npc) {
        throw new Error("Pilot was unable to be refreshed. May have been deleted"); // This is fairly catastrophic
    }
    return tmp_npc;
}
