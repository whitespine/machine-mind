import uuid from "uuid/v4";
import { store } from "@/hooks";

const ordArr = [
    "Primary",
    "Secondary",
    "Tertiary",
    "Quaternary",
    "Quinary",
    "Senary",
    "Septenary",
    "Octonary",
    "Nonary",
    "Denary",
];

export abstract class Loadout {
    private _id: string;
    protected _name: string;

    public constructor(count: number, id?: string | null) {
        this._id = id ? id : uuid();
        this._name = ordArr[count];
    }
}
