
export interface IBonusData {
    id: string,
    value: any
}

export class Bonus {
    constructor(data:  IBonusData) {}

    Serialize(): IBonusData {
        return {
            id: "",
            value: ""
        }
    }

}