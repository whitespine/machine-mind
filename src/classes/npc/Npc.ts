import { nanoid } from "nanoid";

import { Counter, NpcClass, NpcFeature, NpcTemplate } from "@src/class";
import { PackedCounterSaveData, RegCounterData } from "@src/interface";
import { INpcStats } from "./NpcStats";
import { EntryType, InventoriedRegEntry, SerUtil } from "@src/registry";

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
    stats: INpcStats;
    // currentStats: INpcStats; // -- Appears to be unused
}

export interface RegNpcData extends AllNpcData {
    tier: number; // Custom tiering is handled on a per item basis
    custom_counters: RegCounterData[];
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

    // this._tag = this.Class.Role.toLowerCase() === "biological" ? "Biological" : "Mech";

    /*
    public get Power(): number {
        // TODO: calc stat power for custom
        const multiplier = typeof this.Tier === "number" ? this.Tier : 3.5;
        return (this.Class.Power + this.Templates.reduce((a, b) => +a + +b.Power, 0)) * multiplier;
    }
    */

    /* ------------- Class and feature filtering helpers ------------ */
    public get ActiveClass(): NpcClass | null {
        if (this.Classes.length) {
            return this.Classes[0];
        } else {
            console.error("Npc without class!");
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

    // -- Encounter Management ----------------------------------------------------------------------
    public get MaxStructure(): number {
        return 0;
    }

    public get MaxHP(): number {
        return 0;
    }

    public get MaxStress(): number {
        return 0;
    }

    public get HeatCapacity(): number {
        return 0;
    }

    public get Activations(): number {
        return 0;
    }

    public get Actions(): number {
        return 0;
    }

    public get MaxMove(): number {
        return 0;
    }

    public get Evasion(): number {
        return 0;
    }

    public get EDefense(): number {
        return 0;
    }

    protected load(data: RegNpcData): Promise<void> {
        throw new Error("Method not implemented.");
    }

    public async save(): Promise<RegNpcData> {
        return {
            custom_counters: SerUtil.sync_save_all(this.CustomCounters),
            tier: this.Tier,
            burn: this.Burn,
            campaign: this.Campaign,
            cloudImage: this.CloudImage,
            defeat: this.Defeat,
            destroyed: this.Destroyed,
            id: this.ID,
            labels: this.Labels,
            localImage: this.LocalImage,
            name: this.Name,
            note: this.Note,
            overshield: this.Overshield,
            resistances: this.Resistances,
            side: this.Side,
            subtitle: this.Subtitle,
            tag: this.Tag,
        };
    }
}
