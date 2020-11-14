// import { Pilot, Npc, Encounter } from "@src/class";
// import { getVersion } from "jest";

export interface ImageShim {
    getImagePath(subdir: ImageTag, fileName: string, defaults?: boolean | null): string;
    validateImageFolders(): Promise<void>;
    getImagePaths(subdir: ImageTag, defaults?: boolean | null): Promise<string[]>;
    addImage(subdir: ImageTag, imagePath: string): Promise<void>;
    removeImage(subdir: ImageTag, imagePath: string): Promise<void>;
}

// Interface image management
export var imageManagement: ImageShim = {
    getImagePath: (s, f, d) => `${s}/${f}`,
    validateImageFolders: async () => {
        console.warn("Image path validation not hooked");
    },
    getImagePaths: async (s, d) => {
        console.warn("Image paths not hooked");
        return [];
    },
    addImage: async (s, i) => {
        console.warn("Adding images not hooked");
    },
    removeImage: async (s, i) => {
        console.warn("Removing images not hooked");
    },
};

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

// Config this at setup
var user_id: string = "unknown";
export function set_user_id(new_v: string) {
    user_id = new_v;
}

export function get_user_id(): string {
    return user_id;
}
