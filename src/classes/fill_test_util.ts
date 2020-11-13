import { CoreBonus, CoreSystem, Deployable, Environment, Faction, Frame, FrameTrait, License, Manufacturer, Mech, MechSystem, MechWeapon, Organization, Pilot, PilotArmor, PilotGear, PilotWeapon, Quirk, Reserve, Sitrep, Skill, Status, TagTemplate, Talent, WeaponMod } from '@src/class';
import { EntryType, RegEntry } from '@src/registry';
import { keys } from 'ts-transformer-keys';


export const keyset_map: any = {
    [EntryType.CORE_BONUS]: keys<CoreBonus>(),
    [EntryType.CORE_SYSTEM]: keys<CoreSystem>(),
    [EntryType.DEPLOYABLE]: keys<Deployable>(),
    [EntryType.ENVIRONMENT]: keys<Environment>(),
    [EntryType.FACTION]: keys<Faction>(),
    [EntryType.FRAME]: keys<Frame>(),
    [EntryType.FRAME_TRAIT]: keys<FrameTrait>(),
    [EntryType.LICENSE]: keys<License>(),
    [EntryType.MANUFACTURER]: keys<Manufacturer>(),
    [EntryType.WEAPON_MOD]: keys<WeaponMod>(),
    [EntryType.MECH]: keys<Mech>(),
    [EntryType.MECH_SYSTEM]: keys<MechSystem>(),
    [EntryType.MECH_WEAPON]: keys<MechWeapon>(),
    // [EntryType.NPC_CLASS]: NpcClass;
    // [EntryType.NPC_FEATURE]: NpcFeature;
    // [EntryType.NPC_TEMPLATE]: NpcTemplate;
    [EntryType.ORGANIZATION]: keys<Organization>(),
    [EntryType.PILOT_ARMOR]: keys<PilotArmor>(),
    [EntryType.PILOT_GEAR]: keys<PilotGear>(),
    [EntryType.PILOT_WEAPON]: keys<PilotWeapon>(),
    [EntryType.PILOT]: keys<Pilot>(),
    [EntryType.RESERVE]: keys<Reserve>(),
    [EntryType.SITREP]: keys<Sitrep>(),
    [EntryType.SKILL]: keys<Skill>(),
    [EntryType.STATUS]: keys<Status>(),
    [EntryType.TAG]: keys<TagTemplate>(),
    [EntryType.TALENT]: keys<Talent>(),
    [EntryType.QUIRK]: keys<Quirk>(),
}

export function validate_props(v: RegEntry<any>) {
    let entry = v.Type;
    for(let key of keyset_map[entry]) {
        if(v[key] === undefined) {
            let ks = keyset_map[entry];
            console.error(`Error! ${entry} missing key ${key}`);
            throw new Error();
        }
    }
}