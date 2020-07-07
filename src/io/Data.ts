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

var Data: DataShell;

// compcon provides implementation here
declare function InitData(as: DataShell) {
    Data = as;
}


const ensureDataDir = function(): void {
    Data.ensureDataDir();
};

const writeFile = async function(name: string, data: string): Promise<void> {
    Data.writeFile(name, data);
};

const readFile = async function(name: string): Promise<string> {
    return Data.readFile(name);
};

const exists = async function(name: string): Promise<boolean> {
    return Data.exists(name);
};

const saveData = async function<T>(fileName: string, data: T): Promise<void> {
    return Data.saveData(fileName, data);
};

const loadData = async function<T>(fileName: string): Promise<T[]> {
    return Data.loadData(fileName);
};

const importData = async function<T>(file: File): Promise<T> {
    return Data.importData(file);
};

function USER_DATA_PATH(): string {
 return Data.USER_DATA_PATH;
} 

export { DataShell, Data, ensureDataDir, writeFile, readFile, exists, saveData, loadData, importData, USER_DATA_PATH };
