// TODO: make raw coercers for all of these. For now, we just kinda trust (bad idea, bro!)


// Holds enums that are as of yet seen nowhere else
export enum MountType {
    Main = "Main",
    Heavy = "Heavy",
    AuxAux = "Aux/Aux",
    Aux = "Aux",
    MainAux = "Main/Aux",
    Flex = "Flex",
    Integrated = "Integrated",
}

// Defaults to main
export function getMountType(raw: string): MountType {
    switch(raw.toLowerCase()) {
        default:
    case "main":
        return  MountType.Main;
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

export const CORE_BREW_ID = "core";
export const DEFAULT_BREW_ID = "dyn";

// governs what can be added to a mount (weapon slot)
export enum FittingSize {
    Auxiliary = "Auxiliary",
    Main = "Main",
    Flex = "Flex",
    Heavy = "Heavy",
    Integrated = "Integrated",
}

export function getFittingSize(raw: string): FittingSize {
    switch(raw.toLowerCase()) {
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
    switch(raw.toLowerCase()) {
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

export enum ItemType {
    None = "",
    Action = "Action",
    CoreBonus = "CoreBonus",
    Frame = "Frame",
    PilotArmor = "PilotArmor",
    PilotWeapon = "PilotWeapon",
    PilotGear = "PilotGear",
    Skill = "Skill",
    Talent = "Talent",
    Tag = "Tag",
    MechWeapon = "MechWeapon",
    MechSystem = "MechSystem",
    WeaponMod = "WeaponMod",
    NpcFeature = "NpcFeature",
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

export enum TraitUseType {
    Round= "Round",
    Scene= "Scene",
    Encounter= "Encounter",
    Mission= "Mission",
}

export enum CoreUseType {
    Round= "Round",
    Scene= "Next Round",
    Encounter= "Scene",
    Mission= "Encounter",
}

export enum ActivationType {
    None = "None",
    Passive = "Passive",
    Quick = "Quick",
    Full = "Full",
    Other = "Other",
    Reaction = "Reaction",
    Protocol = "Protocol",
    Free = "Free"
}

export enum SkillFamily {
    str = "str",
    dex = "dex",
    int = "int",
    cha = "cha",
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
