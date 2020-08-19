// import { Pilot, Npc, Encounter } from "@/class";
// import { getVersion } from "jest";
import * as DataModules from "./store/main";
export * from "./store/main";

// Interface store interaction
export var store: DataModules.CCDataStore;

export function setup_store(_store: DataModules.CCDataStore) {
    store = _store;
}

// Interface image management
export var imageManagement: ImageShim;

export interface ImageShim {
    getImagePath(subdir: ImageTag, fileName: string, defaults?: boolean | null): string;
    validateImageFolders(): Promise<void>;
    getImagePaths(subdir: ImageTag, defaults?: boolean | null): Promise<string[]>;
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

// Are we web? Controls if images are loaded etc
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
