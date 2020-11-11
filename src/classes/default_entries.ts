import { RegDeployableData, RegMechData, RegPilotArmorData, RegPilotData } from "@src/interface";
import { nanoid } from "nanoid";
import { ActivationType, CC_VERSION, FrameEffectUse } from "./enums";
import { RegLicenseData, UNKNOWN_LICENSE } from './License';
import { RegFrameData } from './mech/Frame';
import { RegFrameTraitData } from './mech/FrameTrait';

export function DEPLOYABLE(): RegDeployableData {
    return {
        actions: [],
        bonuses: [],
        counters: [],
        synergies: [],
        tags: [],
        activation: ActivationType.None,
        armor: 0,
        cost: 1,
        current_hp: 0,
        deactivation: ActivationType.None,
        detail: "",
        edef: 0,
        evasion: 0,
        heatcap: 0,
        max_hp: 0,
        name: "New Deployable",
        overshield: 0,
        recall: ActivationType.None,
        redeploy: ActivationType.None,
        repcap: 0,
        save: 0,
        sensor_range: 0,
        size: 0,
        speed: 0,
        tech_attack: 0,
        type: ""
    }
}

export function LICENSE(): RegLicenseData {
    return {
        manufacturer: null,
        name: "New License",
        rank: 0,
        unlocks: []
    }
}

export function FRAME_TRAIT(): RegFrameTraitData {
    return {
        actions: [],
        bonuses: [],
        counters: [],
        synergies: [],
        // tags: [],
        deployables: [],
        integrated: [],
        description: "",
        name: "New Fraame Trait",
        use: FrameEffectUse.Unknown
    }
}

export function FRAME(): RegFrameData {
    return {
        description: "",
        id: nanoid(),
        license_level: 2,
        mechtype: ["BALANCED"],
        mounts: [],
        name: "New Mech",
        source: UNKNOWN_LICENSE,
        stats: {
            armor: 0,
            edef: 8,
            evasion: 8,
            heatcap: 5,
            hp: 8,
            repcap: 5,
            save: 10,
            sensor_range: 10,
            size: 1,
            sp: 5,
            speed: 5,
            stress: 4,
            structure: 4,
            tech_attack: 0
        },
        traits: [],
        y_pos: 0,
        core_system: null,
        image_url: "",
        other_art: []
    }
}

export function PILOT_ARMOR(): RegPilotArmorData {
    return {
        actions: [],
        bonuses: [],
        deployables: [],
        description: "",
        id: nanoid(),
        name: "New Armor",
        synergies: [],
        tags: []
    }
}

export function PILOT(): RegPilotData {
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

export function MECH(): RegMechData {
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
