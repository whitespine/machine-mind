import { SerUtil, SimSer } from "@src/registry";
import { ActivationType } from "../enums";

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
    Frequency!: Frequency;
    Init!: string | null; // This describes the conditions under which this action becomes available (e.g. activate mimic mesh to get battlefield awareness
    Trigger!: string | null; // What sets this reaction off, if anything
    Terse!: string | null;
    Detail!: string;
    AvailableMounted!: boolean;
    AvailableUnmounted!: boolean;
    HeatCost!: number;
    // We don't handle other fields yet - they're almost purely for flavor. Synergies, maybe someday

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
        this.Frequency = new Frequency(data.frequency || "");
        this.Init = data.init || null;
        this.Trigger = data.trigger || null;
        this.AvailableUnmounted = data.pilot ?? false;
        this.AvailableMounted = data.mech ?? (data.pilot ? false : true); // If undefined, guess that we should only allow if pilot is unset/set false
        this.HeatCost = data.heat_cost ?? 0;
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
