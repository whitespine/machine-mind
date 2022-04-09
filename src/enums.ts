// Holds enums that are as of yet seen nowhere else
export enum MountType {
    Main = "Main",
    Heavy = "Heavy",
    AuxAux = "Aux/Aux",
    Aux = "Aux",
    MainAux = "Main/Aux",
    Flex = "Flex",
    Integrated = "Integrated",
    // This is just to handle undetermined, e.g. by auto addition
    Unknown = "Unknown",
}

export enum NpcFeatureType {
    Trait = "Trait",
    System = "System",
    Reaction = "Reaction",
    Weapon = "Weapon",
    Tech = "Tech",
}

export enum NpcTechType {
    Quick = "Quick",
    Full = "Full",
}

// Defaults to main
export function getMountType(raw: string): MountType {
    switch (raw.toLowerCase()) {
        default:
        case "main":
            return MountType.Main;
        case "heavy":
            return MountType.Heavy;
        case "auxaux":
            return MountType.AuxAux;
        case "aux":
            return MountType.Aux;
        case "mainaux":
            return MountType.MainAux;
        case "flex":
            return MountType.Flex;
        case "integrated":
            return MountType.Integrated;
    }
}
// governs what can be added to a mount (weapon slot)
export enum FittingSize {
    Auxiliary = "Auxiliary",
    Main = "Main",
    Flex = "Flex",
    Heavy = "Heavy",
    Integrated = "Integrated", // wildcard basically
}

export function getFittingSize(raw: string): FittingSize {
    switch (raw.toLowerCase()) {
        case "auxiliary":
            return FittingSize.Auxiliary;
        default:
        case "main":
            return FittingSize.Main;
        case "flex":
            return FittingSize.Flex;
        case "heavy":
            return FittingSize.Heavy;
        case "integrated":
            return FittingSize.Integrated;
    }
}

export enum WeaponSize {
    Aux = "Auxiliary",
    Main = "Main",
    Heavy = "Heavy",
    Superheavy = "Superheavy",
}

export function getWeaponSize(raw: string): WeaponSize {
    switch (raw.toLowerCase()) {
        default:
        case "main":
            return WeaponSize.Main;
        case "auxiliary":
            return WeaponSize.Aux;
        case "heavy":
            return WeaponSize.Heavy;
        case "superheavyj":
            return WeaponSize.Superheavy;
    }
}

export enum WeaponType {
    Rifle = "Rifle",
    Cannon = "Cannon",
    Launcher = "Launcher",
    CQB = "CQB",
    Nexus = "Nexus",
    Melee = "Melee",
}

export enum SystemType {
    System = "System",
    AI = "AI",
    Shield = "Shield",
    Deployable = "Deployable",
    Drone = "Drone",
    Tech = "Tech",
    Armor = "Armor",
    FlightSystem = "Flight System",
    Integrated = "Integrated",
    Mod = "Mod",
}

export enum Duration {
    Free = "Free",
    Turn = "Turn",
    NextTurn = "NextTurn",
    Scene = "Scene",
    Mission = "Mission",
}

export enum FrameEffectUse { // Handles cores and traits usage duration thingies
    Turn = "Turn",
    NextTurn = "Next Turn",
    Round = "Round",
    NextRound = "Next Round",
    Scene = "Scene",
    Encounter = "Encounter",
    Mission = "Mission",
    Unknown = "?",
}

export enum ActivationType {
    None = "None",
    Passive = "Passive",
    Quick = "Quick",
    QuickTech = "Quick Tech",
    Invade = "Invade",
    Full = "Full",
    FullTech = "Full Tech",
    Other = "Other",
    Reaction = "Reaction",
    Protocol = "Protocol",
    Free = "Free",
}

export enum RangeType {
    Range = "Range",
    Threat = "Threat",
    Thrown = "Thrown",
    Line = "Line",
    Cone = "Cone",
    Blast = "Blast",
    Burst = "Burst",
}

export enum DamageType {
    Kinetic = "Kinetic",
    Energy = "Energy",
    Explosive = "Explosive",
    Heat = "Heat",
    Burn = "Burn",
    Variable = "Variable",
}

export enum MechType {
    Balanced = "Balanced",
    Artillery = "Artillery",
    Striker = "Striker",
    Controller = "Controller",
    Support = "Support",
    Defender = "Defender",
}

export enum HASE {
    H = "hull",
    A = "agi",
    S = "sys",
    E = "eng",
}

export enum ReserveType {
    Resources = "Resources",
    Tactical = "Tactical",
    Mech = "Mech",
    Project = "Project",
    Organization = "Organization",
}

export enum OrgType {
    Military = "Military",
    Scientific = "Scientific",
    Academic = "Academic",
    Criminal = "Criminal",
    Humanitarian = "Humanitarian",
    Industrial = "Industrial",
    Entertainment = "Entertainment",
    Political = "Political",
}

export enum EncounterSide {
    Enemy = "Enemy",
    Ally = "Ally",
    Neutral = "Neutral",
}

export { SkillFamily } from "@src/classes/pilot/Skill";
export { DeployableType } from "@src/classes/mech/Deployable";
