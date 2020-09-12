import { ActivationType, Mixin } from "@/class";
import { Mixlet, MixBuilder, MixinHostData } from '@/mixmeta';
export interface IActionData {
  id: string,
  name: string,
  action_type?: ActivationType | null,
  terse: string, // terse text used in the action menu. The fewer characters the better.
  detail: string, // v-html
  pilot: boolean // Only available while unmounted
}

export class Action {
    id: string;
    name: string;
    action_type: ActivationType 
    terse: string; // terse text used in the action menu. The fewer characters the better.
    detail: string; // v-html
    pilot: boolean; // Only available while unmounted

    constructor(data: IActionData) {
        this.id = data.id;
        this.name = data.name
        this.action_type = data.action_type || ActivationType.None;
        this.terse = data.terse;
        this.detail = data.detail;
        this.pilot = data.pilot;
    }

    save(): IActionData {
        return {
            id : this.id,
            name : this.name,
            action_type : this.action_type || null,
            terse : this.terse,
            detail : this.detail,
            pilot : this.pilot,
        }
    }
}

// Mixin stuff
export interface IHasActions {
  actions?: IActionData[] | null,
}

export class MixActions extends Mixin<IHasActions> implements Iterable<Action> {
    private _actions: Action[] = [];
    public get list(): readonly Action[] { return this._actions; }

    // Inline iterator
    public [Symbol.iterator](): Iterator<Action> {
        return this._actions[Symbol.iterator]();
    }

    public load(data: IHasActions) {
        this._actions = data.actions?.map(a => new Action(a)) || [];
    }

    public save(): IHasActions {
        return {
            actions: this._actions.map(a => a.save()),
        }
    }
}

// Use these for shorthand elsewhere
export const ActionMixReader = (x: IActionData[] | null | undefined) => (x || []).map(i => new Action(i));
export const ActionMixWriter = (x: Action[]) => x.map(i => i.save()));


type RawHasActionsAndStuff = object & {
    actions: IActionData[]
}

interface ClassHasActionsAndStuff extends MixinHostData<RawHasActionsAndStuff> {
    Actions: Action[]
}

function makeClass(): ClassHasActionsAndStuff {
    return new MixBuilder<ClassHasActionsAndStuff, RawHasActionsAndStuff>({}).with(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter)).finalize();
}