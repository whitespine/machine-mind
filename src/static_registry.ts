// A trivial implementation of the registry spec

import { EntryType, LiveEntryTypes, RegCat, RegEntry, RegEntryTypes } from './new_meta';
export class StaticRegCat<T extends EntryType> extends RegCat<T> {
    private reg_data: Map<string, RegEntryTypes[T]> = new Map();

    async get_raw(id: string): Promise<RegEntryTypes[T] | null> {
        return this.reg_data.get(id) || null;
    }
    async list_raw(): Promise<RegEntryTypes[T][]> {
        return Array.from(this.reg_data.values());
    }
    async get_live(id: string): Promise<RegEntryTypes[T] | null> {
        let raw = this.reg_data.get(id);
        if(!raw) { return null; }
        return this.creation_func(this.parent, raw);
    }
    async update(...items: LiveEntryTypes[T][]): Promise<void> {
        for(let i of items) {
            this.reg_data.set(i.RegistryID, i.save());
        }
    }
    async delete_id(id: string): Promise<RegEntryTypes[T] | null> {
        let kept = this.reg_data.get(id);
        this.reg_data.delete(id);
        return kept || null;
    }
    async create(...vals: RegEntry<T, RegEntryTypes[T]>[]): Promise<LiveEntryTypes[T][]> {
        throw new Error('Method not implemented.');
    }
    async create_default(): Promise<LiveEntryTypes[T]> {
        throw new Error('Method not implemented.');
    }


}