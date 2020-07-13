import { AbsStoreModule } from "./store_module";
import { PersistentStore } from "@/io/persistence";
import uuid from "uuid/v4";

const CONFIG_FILE_NAME = "user.config";

interface IUserProfile {
    id: string;
    selectorView: string;
    npcView: string;
    rosterView: string;
    hangarView: string;
    pilotSheetView: string;
    theme: string;
}

export class UserProfileStore extends AbsStoreModule {
    // These are set on load and, hopefully, not used before then.
    private _id!: string;
    private _selectorView!: string;
    private _npcView!: string;
    private _rosterView!: string;
    private _hangarView!: string;
    private _pilotSheetView!: string;
    private _theme!: string;

    public constructor(persistence: PersistentStore) {
        super(persistence);
        // Set sensible defaults
    }

    public async saveData(): Promise<void> {
        const data: IUserProfile = {
            id: this.ID,
            selectorView: this.SelectorView,
            npcView: this.NpcView,
            rosterView: this.RosterView,
            hangarView: this.HangarView,
            pilotSheetView: this.PilotSheetView,
            theme: this.Theme,
        };

        await this.persistence.set_item(CONFIG_FILE_NAME, data);
    }

    public async loadData(): Promise<void> {
        // Recall all fields, and set them
        const data = await this.persistence.get_item(CONFIG_FILE_NAME) as IUserProfile;
        if(data) {
        this.ID = data.id;
        this.SelectorView = data.selectorView;
        this.NpcView = data.npcView;
        this.RosterView = data.rosterView;
        this.HangarView = data.hangarView;
        this.PilotSheetView = data.pilotSheetView;
        this.Theme = data.theme;
        } else {
            this._id = uuid();
            this._selectorView = "split";
            this._npcView = "list";
            this._rosterView = "list";
            this._hangarView = "cards";
            this._pilotSheetView = "tabbed";
            this._theme = "gms";
        }
    }

    public get ID(): string {
        return this._id;
    }

    public set ID(id: string) {
        this._id = id;
        this.saveData();
    }

    public get RosterView(): string {
        return this._rosterView;
    }

    public set RosterView(view: string) {
        this._rosterView = view;
        this.saveData();
    }

    public get SelectorView(): string {
        return this._selectorView;
    }

    public set SelectorView(view: string) {
        this._selectorView = view;
        this.saveData();
    }

    public get NpcView(): string {
        return this._npcView;
    }

    public set NpcView(view: string) {
        this._npcView = view;
        this.saveData();
    }

    public get HangarView(): string {
        return this._hangarView;
    }

    public set HangarView(view: string) {
        this._hangarView = view;
        this.saveData();
    }

    public get PilotSheetView(): string {
        return this._pilotSheetView;
    }

    public set PilotSheetView(view: string) {
        this._pilotSheetView = view;
        this.saveData();
    }

    public get Theme(): string {
        return this._theme;
    }

    public set Theme(t: string) {
        this._theme = t;
        this.saveData();
    }

    /*
    public static Deserialize(data: IUserProfile): UserProfile {
        const profile = new UserProfile();
        profile._id = data.id || uuid();
        profile.SelectorView = data.selectorView || "split";
        profile.NpcView = data.npcView || "list";
        profile.RosterView = data.rosterView || "list";
        profile.HangarView = data.hangarView || "cards";
        profile.PilotSheetView = data.pilotSheetView || "tabbed";
        profile.Theme = data.theme || "light";
        return profile;
    }
    */
}
