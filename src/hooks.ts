import { Pilot, Npc, Encounter } from "@/class";
import { getVersion } from "jest";
import Vue from "vue";
import { NpcStore } from "./store/npc";
import { MissionStore } from "./store/mission";
import { EncounterStore } from "./store/encounter";
import { CompendiumStore } from "./store/compendium";
import { PilotManagementStore } from "./store/pilot";
import { StoreInterface } from "./store/store";

// Interface store interaction
export var store: StoreInterface;

export function setup_store_shim(_store: StoreInterface) {
    store = _store;
}

// Interface image management
export var imageManagement: ImageShim;

export interface ImageShim {
    getImagePath(subdir: ImageTag, fileName: string, defaults?: boolean): string;
    validateImageFolders(): Promise<void>;
    getImagePaths(subdir: ImageTag, defaults?: boolean): Promise<string[]>;
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

export var VueSet = Vue.set;
/*
export type VueSetter = (target: Object | Array<any>, item: string | number, val: any) => any;

export var VueSet: VueSetter;

export function setup_vue_shim(setter: VueSetter) {
    VueSet = setter;
}
*/

// Interface Data save/load

// Are we web?
export var is_web: boolean;

export function set_is_web(yes: boolean) {
    is_web = yes;
}

// Logging, as necessary
type Logger = (...data: any[]) => void;
export var logger: Logger = () => {};

export function set_logger(_logger: Logger) {
    logger = _logger;
}
