import { ActivationType } from "@/class";
import { Mixlet, MixBuilder, MixLinks, uuid, ident  } from '@/mixmeta';

export interface IActionData {
  name: string,
  activation: ActivationType,
  cost?: number | null,
  frequency?: string | null,
  init?: string | null,
  trigger?: string,
  terse?: string | null, // terse text used in the action menu. The fewer characters the better.
  detail: string, // v-html
  pilot?: boolean | null // Only available while unmounted
}

export enum ActivePeriod {
  Turn = 'Turn',
  Round = 'Round',
  Encounter = 'Encounter',
  Mission = 'Mission',
  Unlimited = 'Unlimited',
}

export interface Action extends MixLinks<IActionData> {
  Name: string;
  Activation: ActivationType;
  Terse: string;
  Detail: string;
  Cost: number;
  Frequency: Frequency;
  Init: string;
  Trigger: string;
  IsPilotAction: boolean;
  Uses: number
}

export function CreateAction(data: IActionData | null): Action {
    let b = new MixBuilder<Action, IActionData>({
      Uses: 0 // tmp value to not make validation angery
    });

    b.with(new Mixlet("Name", "name", "", ident, ident));
    b.with(new Mixlet("Activation", "activation", ActivationType.None, ident, ident ));
    b.with(new Mixlet("Terse", "terse", "",  ident, ident));
    b.with(new Mixlet("Detail", "detail", "",  ident, ident));
    b.with(new Mixlet("Cost", "cost", 0,  ident, ident));
    b.with(new Mixlet("Frequency", "frequency", new Frequency(""),  FrequencyMixReader, FrequencyMixWriter));
    b.with(new Mixlet("Init", "init", "",  ident, ident));
    b.with(new Mixlet("Trigger", "trigger", "",  ident, ident));
    b.with(new Mixlet("IsPilotAction", "pilot", false,  ident, ident));

    // Fix uses to match frequency (basically, refill uses to max);
    let r = b.finalize(data);
    r.Uses = r.Frequency.Uses;
    return r;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const ActionsMixReader = (x: IActionData[] | null | undefined) => (x || []).map(CreateAction);
export const ActionsMixWriter = (x: Action[]) => x.map(i => i.Serialize());


// Represents how often / how long an action takes effect

const InfiniteUses: number = Number.MAX_SAFE_INTEGER;
export class Frequency {
  //  Default integer
  public Uses: number = InfiniteUses;
  public Duration: ActivePeriod = ActivePeriod.Unlimited;

  public constructor(frq: string) {
    if (frq && !frq.includes('/')) {
      const fArr = frq.split('/')
      const num = parseInt(fArr[0])

      // If valid number, set uses, else return
      if (!Number.isNaN && Number.isInteger(num)) {
        this.Uses = num
      } else return;

      // Parse the / {freq}
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
          // Failed to parse. leave duration as is, and reset uses to invinite
          this.Uses = InfiniteUses;
          break
      }
    }
  }

  public Serialize(): string | null {
    if(this.Duration != ActivePeriod.Unlimited) {
      return `${this.Uses} / ${this.Duration}`
    } else {
      return null
    }

  }
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const FrequencyMixReader = (x: string | null | undefined) => new Frequency(x || "");
export const FrequencyMixWriter = (x: Frequency) => x.Serialize();

/*
export interface ISimpleActions {
     actions?: IActionData[] | null;
}

export interface VSimpleActions {
     Actions: Action[];
}

// Jam in a mixin to quickly load/save actions in the default position
export function simple_actions<Host extends MixLinks<Src> & VSimpleActions, Src extends ISimpleActions>(): Augmentor<Host> {
    return (item) => item._add_mixlet(new Mixlet("Actions", "actions", [], ActionsMixReader, ActionsMixWriter));
}
*/
//}: Augmentor<VSimpleActions> = function<Host extends MixLinks<ISimpleActions> & VSimpleActions>(item: Host): Host {