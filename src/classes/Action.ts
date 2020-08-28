import { ActivationType } from "@/class";

export interface InvasionOption {
    name: string;
    detail: string;
}

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

    Serialize(): IActionData {
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