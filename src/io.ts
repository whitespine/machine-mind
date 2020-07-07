import { Pilot } from "@/class";
import { getVersion } from "jest";

// Interface store interaction
export var store: StoreShim;


export interface HasID {
    ID: string;
}

export interface StoreShim {
     save(): void;
     saveMissionData(): void;
     saveActiveMissionData(): void;
     saveEncounterData(): void;
     getItemCollection<T>(category: string): Array<T>;
     saveNpcData(): void;
     getUserProfile(): HasID;
     referenceByID(category: string, id: string): any;
     instantiate(category: string, data: string): any;
     addPilot(pilot: Pilot): any;
     getVersion: string;
}

export function setup_store_shim(_store: StoreShim) {
    store = _store;
}

// Interface image management
export var imageManagement: ImageShim;

export interface ImageShim {
     getImagePath(subdir: ImageTag, fileName: string, defaults?: boolean): string;
     validateImageFolders(): Promise<void>;
     getImagePaths(
        subdir: ImageTag,
        defaults?: boolean
    ): Promise<string[]>;
     addImage(subdir: ImageTag, imagePath: string): Promise<void>;
     removeImage(subdir: ImageTag, imagePath: string): Promise<void>;
}

export enum ImageTag {
    Pilot = "pilot",
    NPC = "npc",
    Enemy = "enemy",
    Frame = "frame",
    Mech = "mech",
    Map = "map",
    Location = "location",
    Object = "object",
    Logo = "logo",
    Misc = "misc",
}

export function setup_image_shim(image: ImageShim) {
    imageManagement = image;
}

// Interface VueSet
export type VueSetter = (target: Object | Array<any>, item: string | number, val: any) => any;

export var VueSet: VueSetter;

export function setup_vue_shim(setter: VueSetter) {
    VueSet = setter;
}

// Are we web?
export var is_web: boolean;

export function set_is_web(yes: boolean) {
    is_web = yes;
}
