import { AbsStoreModule, load_setter_handler, DataStoreOptions } from "./store_module";
import { PersistentStore } from "@/io/persistence";
import uuid from "uuid/v4";

export const FILEKEY_USER = "user.config";

export interface IUserProfile {
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

        await this.persistence.set_item(FILEKEY_USER, data);
    }

    public async loadData(handler: load_setter_handler<UserProfileStore>): Promise<void> {
        // Recall all fields, and set them
        const data = (await this.persistence.get_item(FILEKEY_USER)) as IUserProfile;
        handler(user => {
            if (data) {
                user.ID = data.id || uuid();
                user.SelectorView = data.selectorView || "split";
                user.NpcView = data.npcView || "list";
                user.RosterView = data.rosterView || "list";
                user.HangarView = data.hangarView || "cards";
                user.PilotSheetView = data.pilotSheetView || "tabbed";
                user.Theme = data.theme || "gms";
            } else {
                user._id = uuid();
                user._selectorView = "split";
                user._npcView = "list";
                user._rosterView = "list";
                user._hangarView = "cards";
                user._pilotSheetView = "tabbed";
                user._theme = "gms";
            }
        });
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
