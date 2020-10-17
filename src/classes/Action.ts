import { RWMix, MixBuilder, MixLinks, uuid, ident, def_empty_map, def, defs, restrict_enum, defn, ser_many, defb  } from '@/mixmeta.typs';
import { SerUtil, SimSer } from '@/new_meta';
import { ActivationType } from './enums';

export interface IActionData {
  id?: string // For synergies and stuff like that
  name: string
  activation: ActivationType
  cost?: number
  frequency?: string
  init?: string
  trigger?: string
  terse?: string
  detail: string
  pilot?: boolean
  sub_actions?: IActionData[]
}

export enum ActivePeriod {
  Turn = 'Turn',
  Round = 'Round',
  Encounter = 'Encounter',
  Mission = 'Mission',
  Unlimited = 'Unlimited',
}

export class Action extends SimSer<IActionData> {
  ID!: string | null;
  Name!: string;
  Activation!: ActivationType;
  Terse!: string | null;
  Detail!: string;
  Cost!: number | null;
  Frequency!: Frequency;
  Init!: string | null; // This describes the conditions under which this action becomes available (e.g. activate mimic mesh to get battlefield awareness
  Trigger!: string | null; // What sets this reaction off, if anything
  SubActions!: Action[];

  protected load(data: IActionData): void {
    this.ID 
    this.Name = data.name;
    this.Activation = SerUtil.restrict_enum(ActivationType, ActivationType.None, data.activation);
    this.Terse = data.terse ||null; 
    this.Detail = data.detail;
    this.Cost = data.cost || null;
    this.Frequency = new Frequency(data.frequency || "");  
    this.Init = data.init || null; 
    this.Trigger = data.trigger || null; 
    this.SubActions = (data.sub_actions || []).map(x => new Action(x));
  }

  public save(): IActionData {
    return {
      id: this.ID || undefined,
      name: this.Name,
      activation: this.Activation,
      terse: this.Terse || undefined,
      detail: this.Detail ,
      cost: this.Cost || undefined,
      frequency: this.Frequency.ToString(),
      init: this.Init || undefined,
      trigger: this.Trigger || undefined,
      sub_actions: this.SubActions.map(x => x.save())
    }
  }
}

class Frequency {
  public readonly Uses: number
  public readonly Duration: ActivePeriod
  private _unlimited: boolean = false;

  public constructor(frq: string) {
    if (!frq || !frq.includes('/')) {
      this.Uses = Number.MAX_SAFE_INTEGER
      this.Duration = ActivePeriod.Unlimited
      this._unlimited = true
    } else {
      const fArr = frq.split('/')
      const num = parseInt(fArr[0])

      if (!Number.isNaN && Number.isInteger(num)) {
        this.Uses = num
      } else {
        this.Uses = Number.MAX_SAFE_INTEGER
        this.Duration = ActivePeriod.Unlimited
        this._unlimited = true
      }

      switch (fArr[1].toLowerCase()) {
        case 'turn':
          this.Duration = ActivePeriod.Turn
          break
        case 'round':
          this.Duration = ActivePeriod.Round
          break
        case 'scene':
        case 'encounter':
          this.Duration = ActivePeriod.Encounter
          break
        case 'mission':
          this.Duration = ActivePeriod.Mission
          break
        default:
          this.Uses = Number.MAX_SAFE_INTEGER
          this.Duration = ActivePeriod.Unlimited
          this._unlimited = true
          break
      }
    }
  }

  public ToString(): string {
    if (this._unlimited) return this.Duration
    return `${this.Uses}/${this.Duration}`
  }
}
