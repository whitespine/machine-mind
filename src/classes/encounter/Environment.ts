import uuid from "uuid/v4";

// This class is perhaps overkill, but it helps so we can do instanceofs and stuff

export interface IEnvironmentData {
    id: string;
    name: string;
    description: string; // v-html
}

export class Environment {
    private _id: string;
    private _name: string;
    private _description: string;

    constructor() {
        this._id = uuid();
        this._name = "";
        this._description = "";
    }

    public get Description(): string {
        return this._description;
    }
    public get Name(): string {
        return this._name;
    }
    public get ID(): string {
        return this._id;
    }

    public static Deserialize(data: IEnvironmentData): Environment {
        let v = new Environment();
        v._description = data.description;
        v._id = data.id;
        v._name = data.id;
        return v;
    }

    public static Serialize(dat: Environment): IEnvironmentData {
        return {
            id: dat._id,
            name: dat._name,
            description: dat._description,
        };
    }
}
