// Define this to give classes ability to save/load data

export interface GetResult<T> {
    result: T | null;
    status: "got" | "nochange" | "notfound";
}

// At a basic level this just abstracts away the IO layer.
// However, we operate under the assumption that these may be expensive
export abstract class PersistentStore {
    public abstract async set_item(key: string, val: any): Promise<void>;
    public abstract async get_item<T>(key: string): Promise<T>;
}
