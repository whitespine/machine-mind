import { SerUtil, SimSer } from "@src/registry";
import { typed_lancer_data } from "@src/data";
import { ActivationType } from "@src/enums";
import {
    SynergyLocation,
    PackedDamageData,
    PackedRangeData,
    RegDamageData,
    RegRangeData,
} from "@src/interface";
import { defaults, lid_format_name, remove_null } from "@src/funcs";
import { nanoid } from "nanoid";
import { Damage, Range } from "@src/class";
import { merge_defaults } from "./default_entries";

interface AllActionData {
    name?: string;
    activation: ActivationType;
    cost?: number;
    frequency?: string;
    init?: string;
    trigger?: string;
    terse?: string;
    detail: string;
    pilot?: boolean;
    mech?: boolean;
    hide_active?: boolean;
    synergy_locations?: string[];
    confirm?: string[];
    log?: string;
    ignore_used?: boolean;
    heat_cost?: number;
}

export interface PackedActionData extends AllActionData {
    id?: string;
    damage?: PackedDamageData[];
    range?: PackedRangeData[];
}

export interface RegActionData extends Required<AllActionData> {
    lid: string;
    damage: RegDamageData[];
    range: RegRangeData[];
}

export enum ActivePeriod {
    Turn = "Turn",
    Round = "Round",
    Encounter = "Encounter",
    Mission = "Mission",
    Unlimited = "Unlimited",
}

export class Action extends SimSer<RegActionData> {
    LID!: string;
    Name!: string;
    Activation!: ActivationType;
    Cost!: number;
    Init!: string; // This describes the conditions under which this action becomes available (e.g. activate mimic mesh to get battlefield awareness
    Trigger!: string; // What sets this reaction off, if anything
    Terse!: string;
    Detail!: string;
    ConfirmText!: string[];
    AvailableMounted!: boolean;
    AvailableUnmounted!: boolean;
    HeatCost!: number;
    SynergyLocations!: SynergyLocation[];
    Damage!: Damage[];
    Range!: Range[];

    // Miscellaneous stuff predominantly used in compcon only. We expose for module devs I guess
    HideActive!: boolean;
    IgnoreUsed!: boolean;
    Log!: string;

    // Frequency we set as string
    private _raw_frequency!: string;
    private _frequency!: Frequency;
    public get RawFrequency(): string {
        return this._raw_frequency;
    }

    public set RawFrequency(nv: string) {
        this._raw_frequency = nv;
        this._frequency = new Frequency(nv);
    }

    get Frequency(): Frequency {
        return this._frequency;
    }

    public static unpack(action: PackedActionData): RegActionData {
        let lid = action.id;
        if (!lid) {
            if (action.name) {
                lid = "act_" + lid_format_name(action.name);
            } else {
                lid = "act_" + nanoid();
            }
        }
        return merge_defaults(
            {
                activation: action.activation,
                detail: action.detail,
                name: action.name,
                confirm: action.confirm ?? [`CONFIRM ${action.name}`],
                cost: action.cost,
                frequency: action.frequency,
                heat_cost: action.heat_cost,
                hide_active: action.hide_active,
                ignore_used: action.ignore_used,
                init: action.init,
                log: action.log,
                mech: action.mech ?? (action.pilot ? false : true),
                pilot: action.pilot ?? action.mech === false,
                synergy_locations: action.synergy_locations,

                terse: action.terse,
                trigger: action.trigger,
                damage: (action.damage ?? []).map(Damage.unpack),
                range: (action.range ?? []).map(Range.unpack),
                lid,
            },
            defaults.ACTION()
        );
    }

    public load(data: RegActionData): void {
        data = { ...defaults.ACTION(), ...data };
        this.LID = data.lid;
        this.Name = data.name;
        this.Activation = SerUtil.restrict_enum(
            ActivationType,
            ActivationType.Quick,
            data.activation
        );
        this.Terse = data.terse;
        this.Detail = data.detail;
        this.Cost = data.cost;
        this.RawFrequency = data.frequency;
        this.Init = data.init;
        this.Trigger = data.trigger;
        this.AvailableMounted = data.mech;
        this.AvailableUnmounted = data.pilot;
        this.HeatCost = data.heat_cost ?? 0;
        this.SynergyLocations = (data.synergy_locations as SynergyLocation[]) ?? [];
        this.Damage = SerUtil.process_damages(data.damage);
        this.Range = SerUtil.process_ranges(data.range);
        this.ConfirmText = data.confirm ? [...data.confirm] : [];
        this.IgnoreUsed = data.ignore_used;
        this.HideActive = data.hide_active;
        this.Log = data.log;
    }

    public save(): RegActionData {
        return {
            lid: this.LID,
            name: this.Name,
            activation: this.Activation,
            terse: this.Terse,
            detail: this.Detail,
            cost: this.Cost,
            frequency: this.RawFrequency,
            init: this.Init,
            trigger: this.Trigger,
            pilot: this.AvailableUnmounted,
            mech: this.AvailableMounted,
            heat_cost: this.HeatCost,
            synergy_locations: this.SynergyLocations,
            damage: SerUtil.save_all(this.Damage),
            range: SerUtil.save_all(this.Range),
            confirm: this.ConfirmText,
            hide_active: this.HideActive,
            ignore_used: this.IgnoreUsed,
            log: this.Log,
        };
    }

    public async emit(): Promise<PackedActionData> {
        return remove_null({
            // TODO: Include _all_ fields
            activation: this.Activation,
            detail: this.Detail,
            name: this.Name,
            confirm: this.ConfirmText,
            cost: this.Cost,
            frequency: this.RawFrequency,
            heat_cost: this.HeatCost,
            hide_active: this.HideActive,
            id: this.LID,
            ignore_used: this.IgnoreUsed,
            init: this.Init,
            log: this.Log,
            mech: this.AvailableMounted,
            pilot: this.AvailableUnmounted,
            range: await SerUtil.emit_all(this.Range),
            damage: await SerUtil.emit_all(this.Damage),
            synergy_locations: this.SynergyLocations,
            terse: this.Terse,
            trigger: this.Trigger,
        });
    }
}

class Frequency {
    public readonly Uses: number;
    public readonly Duration: ActivePeriod;
    private _unlimited: boolean = false;

    public constructor(frq: string) {
        if (!frq || !frq.includes("/")) {
            this.Uses = Number.MAX_SAFE_INTEGER;
            this.Duration = ActivePeriod.Unlimited;
            this._unlimited = true;
        } else {
            const fArr = frq.split("/");
            const num = parseInt(fArr[0]);

            if (!Number.isNaN && Number.isInteger(num)) {
                this.Uses = num;
            } else {
                this.Uses = Number.MAX_SAFE_INTEGER;
                this.Duration = ActivePeriod.Unlimited;
                this._unlimited = true;
            }

            switch (fArr[1].toLowerCase()) {
                case "turn":
                    this.Duration = ActivePeriod.Turn;
                    break;
                case "round":
                    this.Duration = ActivePeriod.Round;
                    break;
                case "scene":
                case "encounter":
                    this.Duration = ActivePeriod.Encounter;
                    break;
                case "mission":
                    this.Duration = ActivePeriod.Mission;
                    break;
                default:
                    this.Uses = Number.MAX_SAFE_INTEGER;
                    this.Duration = ActivePeriod.Unlimited;
                    this._unlimited = true;
                    break;
            }
        }
    }

    public ToString(): string {
        if (this._unlimited) return this.Duration;
        return `${this.Uses}/${this.Duration}`;
    }
}

// There are some default actions defined as well. We make accessing them simpler here
export const BaseActionsMap: Map<string, Action> = new Map();
for (let t of typed_lancer_data.actions) {
    BaseActionsMap.set(t.id!, new Action(Action.unpack(t)));
}
