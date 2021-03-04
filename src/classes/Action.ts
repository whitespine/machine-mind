import { SerUtil, SimSer } from "@src/registry";
import { typed_lancer_data } from "..";
import { ActivationType } from "../enums";
import { SynergyLocation } from "@src/interface";

export interface IActionData {
    id?: string;
    name: string;
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

export enum ActivePeriod {
    Turn = "Turn",
    Round = "Round",
    Encounter = "Encounter",
    Mission = "Mission",
    Unlimited = "Unlimited",
}

export class Action extends SimSer<IActionData> {
    ID!: string | null;
    Name!: string;
    Activation!: ActivationType;
    Cost!: number | null;
    Init!: string | null; // This describes the conditions under which this action becomes available (e.g. activate mimic mesh to get battlefield awareness
    Trigger!: string | null; // What sets this reaction off, if anything
    Terse!: string | null;
    Detail!: string;
    AvailableMounted!: boolean;
    AvailableUnmounted!: boolean;
    HeatCost!: number;
    SynergyLocations!: SynergyLocation[];
    // We don't handle other fields yet - they're almost purely for flavor. Synergies, maybe someday

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

    public load(data: IActionData): void {
        this.ID;
        this.Name = data.name;
        this.Activation = SerUtil.restrict_enum(
            ActivationType,
            ActivationType.None,
            data.activation
        );
        this.Terse = data.terse || null;
        this.Detail = data.detail;
        this.Cost = data.cost || null;
        this.RawFrequency = data.frequency || "";
        this.Init = data.init || null;
        this.Trigger = data.trigger || null;
        this.AvailableUnmounted = data.pilot ?? false;
        this.AvailableMounted = data.mech ?? (data.pilot ? false : true); // If undefined, guess that we should only allow if pilot is unset/set false
        this.HeatCost = data.heat_cost ?? 0;
        this.SynergyLocations = (data.synergy_locations as SynergyLocation[]) ?? [];
    }

    public save(): IActionData {
        return {
            id: this.ID || undefined,
            name: this.Name,
            activation: this.Activation,
            terse: this.Terse || undefined,
            detail: this.Detail,
            cost: this.Cost || undefined,
            frequency: this.Frequency.ToString(),
            init: this.Init || undefined,
            trigger: this.Trigger || undefined,
            pilot: this.AvailableUnmounted,
            mech: this.AvailableMounted,
            heat_cost: this.HeatCost,
            synergy_locations: this.SynergyLocations,
        };
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
let _cached_bam: Map<string, Action> | null = null;
export function BaseActionsMap(): Map<string, Action> {
    if (!_cached_bam) {
        _cached_bam = new Map();
        for (let t of typed_lancer_data.actions) {
            _cached_bam.set(t.id!, new Action(t));
        }
    }
    return _cached_bam;
}
