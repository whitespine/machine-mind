import { ActivationType } from "@/class";
import { Mixlet, MixBuilder, MixLinks, uuid, ident  } from '@/mixmeta';
export interface IActionData {
  id: string,
  name: string,
  action_type?: ActivationType | null,
  terse: string, // terse text used in the action menu. The fewer characters the better.
  detail: string, // v-html
  pilot: boolean // Only available while unmounted
}

export interface Action extends MixLinks<IActionData> {
    ID: string;
    Name: string;
    ActionType: ActivationType 
    Terse: string; // terse text used in the action menu. The fewer characters the better.
    Detail: string; // v-html
    Pilot: boolean; // Only available while unmounted
}

export function CreateAction(data: IActionData | null): Action {
    let b = new MixBuilder<Action, IActionData>({});
    b.with(new Mixlet("ID", "id", uuid(), ident, ident));
    b.with(new Mixlet("Name", "name", "New Armor", ident, ident));
    b.with(new Mixlet("ActionType", "action_type", ActivationType.None, ident, ident));
    b.with(new Mixlet("Terse", "terse", ActivationType.None, ident, ident));
    b.with(new Mixlet("Detail", "detail", "", ident, ident));
    b.with(new Mixlet("Pilot", "pilot", false, ident, ident));

    let r = b.finalize(data);
    return r;
}

// Use these for mixin shorthand elsewhere in items that have many actions
export const ActionMixReader = (x: IActionData[] | null | undefined) => (x || []).map(CreateAction);
export const ActionMixWriter = (x: Action[]) => x.map(i => i.Serialize());

/*
export interface ISimpleActions {
     actions?: IActionData[] | null;
}

export interface VSimpleActions {
     Actions: Action[];
}

// Jam in a mixin to quickly load/save actions in the default position
export function simple_actions<Host extends MixLinks<Src> & VSimpleActions, Src extends ISimpleActions>(): Augmentor<Host> {
    return (item) => item._add_mixlet(new Mixlet("Actions", "actions", [], ActionMixReader, ActionMixWriter));
}
*/
//}: Augmentor<VSimpleActions> = function<Host extends MixLinks<ISimpleActions> & VSimpleActions>(item: Host): Host {