import { IUserProfile } from "@/interface";
import { Pilot } from "@/class";
import { getVersion } from "jest";

// Interface store interaction
export var store: StoreShim;

export abstract class StoreShim {
    abstract save(): void;
    abstract saveMissionData(): void;
    abstract saveActiveMissionData(): void;
    abstract saveEncounterData(): void;
    abstract getItemCollection<T>(category: string): Array<T>;
    abstract saveNpcData(): void;
    abstract getUserProfile(): IUserProfile;
    abstract referenceByID(category: string, id: string): any;
    abstract instantiate(category: string, data: string): any;
    abstract addPilot(pilot: Pilot): any;
    abstract getVersion: string;
}

export function setup_store_shim(_store: StoreShim) {
    store = _store;
}



// Interface image management
export var imageManagement: ImageShim;

export abstract class ImageShim {
    abstract getImagePath(subdir: ImageTag, fileName: string, defaults?: boolean): string;
    abstract validateImageFolders(): Promise<void>;
    abstract getImagePaths(subdir: ImageTag, fileName: string, defaults?: boolean): Promise<string[]>;
    abstract addImage(subdir: ImageTag, imagePath: string): Promise<void>;
    abstract removeImage(subdir: ImageTag, imagePath: string): Promise<void>;
}

export enum ImageTag {
  Pilot = 'pilot',
  NPC = 'npc',
  Enemy = 'enemy',
  Frame = 'frame',
  Mech = 'mech',
  Map = 'map',
  Location = 'location',
  Object = 'object',
  Logo = 'logo',
  Misc = 'misc',
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
    is_web= yes;
}