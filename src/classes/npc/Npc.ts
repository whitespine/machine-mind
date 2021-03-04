import { nanoid } from "nanoid";

import { Counter, NpcClass, NpcClassStats, NpcFeature, NpcTemplate } from "@src/class";
import { INpcClassStats, INpcStatComposite, PackedCounterSaveData, RegCounterData } from "@src/interface";
import { EntryType, InventoriedRegEntry, RegEntry, SerUtil } from "@src/registry";
import { defaults } from "@src/funcs";

interface INpcItemSaveData {
    // unsure if we really need this
    itemID: string;
    tier: number;
    flavorName: string;
    description: string;
    destroyed: boolean;
    charged: boolean;
    uses: number;
}

interface AllNpcData {
    id: string;
    tier: number | string;
    name: string;
    subtitle: string;
    campaign: string;
    labels: string[];
    tag: string;
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

export interface PackedNpcData {
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
}

export interface RegNpcData extends AllNpcData {
    tier: number; // Custom tiering is handled on a per item basis
    custom_counters: RegCounterData[];
    current_hp: number;
    current_heat: number;
    current_stress: number;
    current_structure: number;
    // Other stuff held in inventory
}

export class Npc extends InventoriedRegEntry<EntryType.NPC> {
    // Held data
    ID!: string;
    Tier!: number;
    Name!: string;
    Subtitle!: string;
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
        ).filter(x => !this.SelectedFeatures.some(y => y.ID === x.ID));
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
        return this.stat("size");
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
        data = { ...defaults.NPC(), ...data };
        let subreg = await this.get_inventory();
        this.CustomCounters = SerUtil.process_counters(data.custom_counters);
        this.Tier = data.tier;
        this.Burn = data.burn;
        this.Campaign = data.campaign;
        this.CloudImage = data.cloudImage;
        this.Defeat = data.defeat;
        this.Destroyed = data.destroyed;
        this.ID = data.id;
        this.CurrentHP = data.current_hp;
        this.CurrentHeat = data.current_heat;
        this.CurrentStress = data.current_stress;
        this.CurrentStructure = data.current_structure;
        this.Labels = data.labels;
        this.LocalImage = data.localImage;
        this.Name = data.name;
        this.Note = data.note;
        this.Overshield = data.overshield;
        this.Resistances = data.resistances;
        this.Side = data.side;
        this.Subtitle = data.subtitle;
        this.Tag = data.tag;

        this._features = await subreg.get_cat(EntryType.NPC_FEATURE).list_live(this.OpCtx);
        this._templates = await subreg.get_cat(EntryType.NPC_TEMPLATE).list_live(this.OpCtx);
        this._classes = await subreg.get_cat(EntryType.NPC_CLASS).list_live(this.OpCtx);
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
            id: this.ID,
            current_hp: this.CurrentHP,
            current_heat: this.CurrentHeat,
            labels: this.Labels,
            localImage: this.LocalImage,
            name: this.Name,
            note: this.Note,
            overshield: this.Overshield,
            resistances: this.Resistances,
            side: this.Side,
            subtitle: this.Subtitle,
            tag: this.Tag,
            current_stress: this.CurrentStress,
            current_structure: this.CurrentStructure,
        };
    }
}
