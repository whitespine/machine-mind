import { RWMix, MixBuilder, MixLinks, uuid, ident, def_empty_map, def, defs, restrict_enum, defn, ser_many, defb  } from '@/mixmeta';
import { SimSer } from '@/new_meta';
import { ActivationType } from './enums';
import { Registry } from './registry';

export interface IActionData {
  name: string,
  activation: ActivationType,
  cost?: number,
  frequency?: string ,
  init?: string ,
  trigger?: string,
  terse?: string , // terse text used in the action menu. The fewer characters the better.
  detail: string, // v-html
  pilot?: boolean  // Only available while unmounted
}

export enum ActivePeriod {
  Turn = 'Turn',
  Round = 'Round',
  Encounter = 'Encounter',
  Mission = 'Mission',
  Unlimited = 'Unlimited',
}

export class Action extends SimSer<IActionData> {
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

export async function CreateAction(data: IActionData | null, ctx: Registry): Promise<Action> {
    let b = new MixBuilder<Action, IActionData>({
      Uses: 0 // tmp value to not make validation angery
    });

    b.with(new RWMix("Name", "name", defs("New Action"), ident));
    b.with(new RWMix("Activation", "activation", restrict_enum(ActivationType, ActivationType.None), ident ));
    b.with(new RWMix("Terse", "terse",  defs("Terse description"), ident));
    b.with(new RWMix("Detail", "detail",  defs("Detailed description"), ident));
    b.with(new RWMix("Cost", "cost",  defn(1), ident));
    b.with(new RWMix("Frequency", "frequency",  FrequencyMixReader, FrequencyMixWriter));
    b.with(new RWMix("Init", "init",  defs("Init, idk what this means lol pls halp"), ident));
    b.with(new RWMix("Trigger", "trigger", defs("Trigger"), ident));
    b.with(new RWMix("IsPilotAction", "pilot",  defb(false), ident));

    // Fix uses to match frequency (basically, refill uses to max);
    let r = await b.finalize(data, ctx);
    r.Uses = r.Frequency.Uses;
    return r;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const ActionsMixReader = def_empty_map(CreateAction);

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

  public Serialize(): string | undefined {
    if(this.Duration != ActivePeriod.Unlimited) {
      return `${this.Uses} / ${this.Duration}`
    } else {
      return undefined
    }

  }
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const FrequencyMixReader = async (x: string  | undefined) => new Frequency(x || "");
export const FrequencyMixWriter = async (x: Frequency) => x.Serialize();