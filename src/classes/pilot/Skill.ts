import { ident, MixBuilder, MixLinks, RWMix, uuid } from '@/mixmeta';
import { IRegistryItemData, VRegistryItem } from '../CompendiumItem';

export enum SkillFamily {
    str = "str",
    dex = "dex",
    int = "int",
    cha = "cha",
    con = "con",
    custom = "custom"
}
export interface ISkillData extends IRegistryItemData {
    id: string,
    name: string,
    description: string, // terse, prefer fewest chars
    detail: string; // v-html
    family: SkillFamily; // TODO: Probably just drop this. Kinda dumb to hardcode limiters when they don't really matter aside from visual categorization
}

export interface Skill extends MixLinks<ISkillData>, VRegistryItem {
    ID: string;
    Name: string; // The trigger name
    Description: string;
    Detail: string;
    Family: SkillFamily;
}

export function CreateSkill(data: ISkillData | null) {
    const mb = new MixBuilder<Skill, ISkillData>({});
    mb.with(new RWMix("ID", "id", uuid(), ident, ident));
    mb.with(new RWMix("Name", "name", "NEW TRIGGER", ident, ident));
    mb.with(new RWMix("Description", "description", "No description", ident, ident));
    mb.with(new RWMix("Detail", "detail", "", ident, ident));
    mb.with(new RWMix("Family", "family", SkillFamily.con, ident, ident));
    return mb.finalize(data);
}