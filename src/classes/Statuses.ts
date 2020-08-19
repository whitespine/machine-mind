export interface IStatusData {
    name: string;
    type: "Status" | "Condition";
    icon: string;
    effects: string[];
}

export class Status {
    private _name: string;
    private _icon: string;
    private _effects: string[];
    private _type: "Status" | "Condition";

    public get Name(): string {
        return this._name;
    }

    public get Icon(): string {
        return this._icon;
    }

    public get Effects(): string[] {
        return this._effects;
    }
    
    public get Type(): "Status" | "Condition" {
        return this._type;
    }

    constructor(type: "Status" | "Condition") {
        this._type = type;
        this._name = "";
        this._icon = "";
        this._effects = [];
    }

    public Serialize(): IStatusData {
        return {
            name: this._name,
            icon: this._icon,
            type: this._type,
            effects: this._effects
        };
    }

    public get is_status(): boolean {
        return this._type == "Status";
    }

    public get is_condition(): boolean {
        return this._type == "Condition";
    }

    public static Deserialize(data: IStatusData): Status {
        let tmp = new Status(data.type);
        tmp._name = data.name;
        tmp._icon = data.icon;
        tmp._effects = data.effects;
        return tmp;
    }
}