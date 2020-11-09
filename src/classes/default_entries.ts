import { RegPilotData } from "@src/interface";
import { nanoid } from "nanoid";
import { CC_VERSION } from "./enums";
import { PackedMechData, RegMechData } from "./mech/Mech";

export function DEFAULT_PILOT(): RegPilotData {
    return {
        name: "New Pilot",
        active_mech: null,
        background: "",
        callsign: "",
        campaign: "",
        cc_ver: CC_VERSION,
        cloudID: "",
        cloudOwnerID: "",
        cloud_portrait: "",
        core_bonuses: [],
        current_hp: 0,
        custom_counters: [],
        faction: null,
        group: "",
        history: "",
        id: nanoid(),
        lastCloudUpdate: "",
        level: 0,
        loadout: {
            id: nanoid(),
            name: "Foundry Loadout",
            armor: [null],
            gear: [null, null, null],
            weapons: [null, null],
            extendedGear: [null, null],
            extendedWeapons: [null],
        },
        mechSkills: [0, 0, 0, 0],
        mechs: [],
        mounted: false,
        notes: "",
        organizations: [],
        owned_armor: [],
        owned_gear: [],
        owned_weapons: [],
        player_name: "",
        portrait: "",
        quirk: null,
        skills: [],
        sort_index: 0,
        status: "",
        talents: [],
        text_appearance: "",
    };
}

export function DEFAULT_MECH(): RegMechData {
    return {
        activations: 1,
        burn: 0,
        cc_ver: CC_VERSION,
        cloud_portrait: "",
        core_active: false,
        current_core_energy: 1,
        current_heat: 0,
        current_hp: 0,
        current_overcharge: 0,
        current_repairs: 0,
        current_stress: 0,
        current_structure: 0,
        ejected: false,
        gm_note: "",
        id: nanoid(),
        loadout: {
            frame: null,
            system_mounts: [],
            weapon_mounts: []
        },
        meltdown_imminent: false,
        name: "New Mech",
        notes: "",
        overshield: 0,
        pilot: null,
        portrait: "",
        reactions: [],
        resistances: [],
        statuses_and_conditions: []
    };
}
