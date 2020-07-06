abstract class DataShell {
    abstract ensureDataDir(): void;
    abstract async writeFile(name: string, data: string): Promise<void>;
    abstract async readFile(name: string): Promise<string>;
    abstract async saveData<T>(fileName: string, data: T): Promise<void>;
    abstract async loadData<T>(fileName: string): Promise<T[]>;
    abstract async importData<T>(file: File): Promise<T>;
    abstract async exists(name: string): Promise<boolean>;
    abstract get USER_DATA_PATH();
}

// compcon provides implementation here
declare function Data(): DataShell;

/*
import { Capacitor } from "@capacitor/core";
import path from "path";
import { promisify } from "util";
import PromisifyFileReader from "promisify-file-reader";

import ExtLog from "./ExtLog";

const PLATFORM = Capacitor.platform;
const platformNotSupportedMessage = `ERROR - PLATFORM NOT SUPPORTED: "${PLATFORM}" `;

// variables used by electron
let fs: typeof import("fs");
let electron: typeof import("electron");
let userDataPath: string;

if (PLATFORM == "electron") {
    fs = require("fs");
    electron = require("electron");
    userDataPath = path.join((electron.app || electron.remote.app).getPath("userData"), "data");
}

const ensureDataDir = function(): void {
    switch (PLATFORM) {
        case "web":
            return;
        case "electron":
            const dataPathExists = fs.existsSync(userDataPath);
            if (!dataPathExists) {
                fs.mkdirSync(userDataPath);
                ExtLog(`Created user data directory at ${userDataPath}`);
            }
            break;
        default:
            throw new Error(platformNotSupportedMessage);
    }
};

const writeFile = async function(name: string, data: string): Promise<void> {
    switch (PLATFORM) {
        case "web":
            localStorage.setItem(name, data);
            break;
        case "electron":
            await promisify(fs.writeFile)(path.resolve(userDataPath, name), data);
            break;
        default:
            throw new Error(platformNotSupportedMessage);
    }
};

const readFile = async function(name: string): Promise<string> {
    switch (PLATFORM) {
        case "web":
            return localStorage.getItem(name);
        case "electron":
            return await promisify(fs.readFile)(path.resolve(userDataPath, name), "utf-8");
        default:
            throw new Error(platformNotSupportedMessage);
    }
};

const exists = async function(name: string): Promise<boolean> {
    switch (PLATFORM) {
        case "web":
            return Boolean(localStorage.getItem(name));
        case "electron":
            return await promisify(fs.exists)(path.resolve(userDataPath, name));
        default:
            throw new Error(platformNotSupportedMessage);
    }
};

const saveData = async function<T>(fileName: string, data: T): Promise<void> {
    return writeFile(fileName, JSON.stringify(data));
};

const loadData = async function<T>(fileName: string): Promise<T[]> {
    const fileExists = await exists(fileName);
    if (fileExists) {
        const dataText = await readFile(fileName);
        return (JSON.parse(dataText) || []) as T[];
    } else {
        return [];
    }
};

const importData = async function<T>(file: File): Promise<T> {
    const text = await PromisifyFileReader.readAsText(file);
    return JSON.parse(text) as T;
};

const dataPathMap = {
    web: "localStorage",
    electron: userDataPath,
};

const USER_DATA_PATH = dataPathMap[PLATFORM];

*/
export { DataShell, Data };
