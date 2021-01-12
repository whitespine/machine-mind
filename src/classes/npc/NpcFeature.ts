import { Damage, TagInstance, Range } from "@src/class";
import { DamageType, NpcFeatureType, RangeType } from "@src/enums";
import { defaults } from "@src/funcs";
import { PackedRangeData, PackedTagInstanceData, RegDamageData, RegRangeData, RegTagInstanceData } from "@src/interface";
import { EntryType, OpCtx, RegEntry, Registry, SerUtil } from "@src/registry";

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Rider types
/////////////////////////////////////////////////////////////////////////////////////////////////////
// Tracks where the feature comes from
export interface IOriginData {
    type: "Class" | "Template";
    name: string; // The class or template it is from
    base: boolean; // Whether it is a base feature of that class or template
}

export interface PackedNpcDamageData {
    type: string;
    damage: number[];
}


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Packed main types
/////////////////////////////////////////////////////////////////////////////////////////////////////

// Note: At present, just a raw implementation of the compcon method, which is due to be refactored at some point
interface PackedNpcFeatureData {
    id: string;
    name: string;
    origin: IOriginData;
    effect?: string;
    bonus?: object;
    override?: object;

    tags: PackedTagInstanceData[];
    locked: boolean; // If it can be removed, maybe?
    hide_active: boolean; // ???????
    type: NpcFeatureType;
}

export interface PackedNpcWeaponData extends PackedNpcFeatureData {
    weapon_type: string;
    damage: PackedNpcDamageData[];
    range: PackedRangeData[];
    on_hit: string;
    accuracy?: number[] | null;
    attack_bonus?: number[] | null;
    tags: PackedTagInstanceData[];
    type: NpcFeatureType.Weapon;
}

export interface PackedNpcTraitData extends PackedNpcFeatureData {
    type: NpcFeatureType.Trait;
}

export interface PackedNpcReactionData extends PackedNpcFeatureData {
    type: NpcFeatureType.Reaction;
    trigger: string;
}

export interface PackedNpcSystemData extends PackedNpcFeatureData {
    type: NpcFeatureType.System;
}

export interface PackedNpcTechData extends PackedNpcFeatureData {
    type: NpcFeatureType.Tech;

    tags: PackedTagInstanceData[];
    tech_type: string;
    accuracy?: number[] | null;
    attack_bonus?: number[] | null;
}

// Combines all of our types
export type AnyPackedNpcFeatureData = PackedNpcTechData | PackedNpcTraitData | PackedNpcWeaponData | PackedNpcSystemData | PackedNpcWeaponData | PackedNpcReactionData;

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Reg main types
/////////////////////////////////////////////////////////////////////////////////////////////////////
export interface BaseRegNpcFeatureData {
    id: string;
    name: string;
    origin: IOriginData;
    effect: string;
    bonus: object;
    override: object;
    tags: RegTagInstanceData[];
    type: NpcFeatureType;
}

export interface RegNpcWeaponData extends BaseRegNpcFeatureData {
    weapon_type: string;
    damage: RegDamageData[][]; // Damage array by tier
    range: RegRangeData[];
    on_hit: string;
    accuracy: number[];
    attack_bonus: number[];
    type: NpcFeatureType.Weapon;
}

export interface RegNpcTraitData extends BaseRegNpcFeatureData {
    type: NpcFeatureType.Trait;
}

export interface RegNpcReactionData extends BaseRegNpcFeatureData {
    type: NpcFeatureType.Reaction;
    trigger: string;
}

export interface RegNpcSystemData extends BaseRegNpcFeatureData {
    type: NpcFeatureType.System;
}

export interface RegNpcTechData extends BaseRegNpcFeatureData {
    type: NpcFeatureType.Tech;
    tags: RegTagInstanceData[];
    tech_type: string;
    accuracy: number[];
    attack_bonus: number[];
}

export type AnyRegNpcFeatureData = RegNpcTechData | RegNpcTraitData | RegNpcWeaponData | RegNpcSystemData | RegNpcWeaponData | RegNpcReactionData;


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Omnibus class implementations
/////////////////////////////////////////////////////////////////////////////////////////////////////
export class NpcFeature extends RegEntry<EntryType.NPC_FEATURE> {
    public ID!: string;
    public Name!: string;
    public Origin!: IOriginData;
    public Effect!: string;
    public Bonus!: object;
    public Override!: object;
    // public Locked!: boolean;
    public Tags!: TagInstance[];
    public FeatureType!: NpcFeatureType;

    // Henceforth we have things that may or may not actually be there! Defaults are provided, but meaningless
    public Range: Range[] = [];
    public Damage: Damage[][] = [[],[],[]];
    public Accuracy: number[] = [];
    public Trigger: string = "";
    public TechType: string = "";
    public WeaponType: string = "";
    public AttackBonus: number[] = [];
    public OnHit: string = "";
    
    // TODO: Hide these types via private

    public get FormattedEffect(): string {
        if (!this.Effect) return "";
        const perTier = /(\{.*?\})/;
        const m = this.Effect.match(perTier);
        if (m) {
            return this.Effect.replace(
                perTier,
                m[0].replace("{", '<b class="accent--text">').replace("}", "</b>")
            );
        }
        return this.Effect;
    }

    public FormattedEffectByTier(tier: number): string {
        if (!this.Effect) return "";
        let fmt = this.Effect;
        const perTier = /(\{.*?\})/g;
        const m = this.Effect.match(perTier);
        if (m) {
            m.forEach(x => {
                const tArr = x
                    .replace("{", "")
                    .replace("}", "")
                    .split("/");
                fmt = fmt.replace(x, `<b class="accent--text">${tArr[tier - 1]}</b>`);
            });
        }
        return fmt;
    }

    protected async load(data: AnyRegNpcFeatureData): Promise<void> {
        data = { ...defaults.NPC_FEATURE(), ...data };
        this.ID = data.id;
        this.Name = data.name;
        this.Origin = {...data.origin};
        this.Effect = data.effect;
        this.Bonus = data.bonus;
        this.Override = data.override;
        this.Tags = await SerUtil.process_tags(this.Registry, this.OpCtx, data.tags);
        this.FeatureType = data.type;

        // Fetch whatever else is there
        switch(data.type) {
           case NpcFeatureType.Reaction:
                data = {...defaults.NPC_REACTION(), ...data};
                this.Trigger = data.trigger;
                return;
            case NpcFeatureType.Tech: 
                data = {...defaults.NPC_TECH(), ...data};
                this.TechType = data.tech_type;
                this.Accuracy = [...data.accuracy];
                this.AttackBonus = [...data.attack_bonus];
                return;
            case NpcFeatureType.Weapon:
                data = {...defaults.NPC_WEAPON(), ...data};
                this.Accuracy = [...data.accuracy];
                this.AttackBonus = [...data.attack_bonus];
                this.WeaponType = data.weapon_type;
                this.Damage = data.damage.map(dr => dr.map(d => new Damage(d)));
                this.Range = data.range.map(r => new Range(r));
                this.OnHit = data.on_hit;
                return;
            case NpcFeatureType.System:
            case NpcFeatureType.Trait:
            default:
                return; // Nothing more
        }
    }

    protected save_imp(): AnyRegNpcFeatureData {
        let base: BaseRegNpcFeatureData = {
            id: this.ID,
            name: this.Name,
            origin: this.Origin,
            effect: this.Effect,
            bonus: this.Bonus,
            override: this.Override,
            tags: SerUtil.save_all(this.Tags),
            type: this.FeatureType,
        };

        switch(this.FeatureType) {
            case NpcFeatureType.Reaction:
                let result_react: RegNpcReactionData = {
                    ...base, 
                    trigger: this.Trigger,
                    type: NpcFeatureType.Reaction
                };
                return result_react;
            case NpcFeatureType.System:
                let result_sys: RegNpcSystemData = {
                    ...base,
                    type: NpcFeatureType.System
                };
                return result_sys;
            case NpcFeatureType.Tech: 
                let result_tech: RegNpcTechData = {
                    ...base,
                    tech_type: this.TechType,
                    accuracy: [...this.Accuracy],
                    attack_bonus: [...this.AttackBonus],
                    type: NpcFeatureType.Tech
                };
                return result_tech;
            case NpcFeatureType.Weapon:
                let result_wep: RegNpcWeaponData = {
                    ...base,
                    accuracy: [...this.Accuracy],
                    attack_bonus: [...this.AttackBonus],
                    weapon_type: this.WeaponType,
                    damage: this.Damage.map(s => SerUtil.save_all(s)),
                    range: SerUtil.save_all(this.Range),
                    on_hit: this.OnHit,
                    type: NpcFeatureType.Weapon
                };
                return result_wep;
            default:
            case NpcFeatureType.Trait:
                return {
                    ...base,
                    type: NpcFeatureType.Trait
                };
        }
    }

    // Unpacking is a bit of a mess, due to the variety of types we want to safely handle
    public static async unpack(
        data: AnyPackedNpcFeatureData,
        reg: Registry,
        ctx: OpCtx
    ): Promise<NpcFeature> {
        let tags = SerUtil.unpack_tag_instances(reg, data.tags);
        let result: AnyRegNpcFeatureData;
        if(data.type == NpcFeatureType.Reaction) {
            let result_react: RegNpcReactionData = {
                ...defaults.NPC_REACTION(),
                ...data, 
                tags
            };
            result = result_react;
        } else if(data.type == NpcFeatureType.System) {
            let result_sys: RegNpcSystemData = {
                ...defaults.NPC_SYSTEM(),
                ...data,
                tags
            };
            result = result_sys;
        } else if(data.type == NpcFeatureType.Tech) {
            let result_tech: RegNpcTechData = {
                ...defaults.NPC_TECH(),
                ...data,
                tags,
                accuracy: data.accuracy ?? [0, 0, 0],
                attack_bonus: data.attack_bonus ?? [0, 0, 0]
            };
            result = result_tech;
        } else if(data.type == NpcFeatureType.Weapon) {
            // Gotta adapt the damage to a proper RegDamageData array
            let damage: RegDamageData[][] = []; 
            for(let raw_dmg of (data.damage ?? [])) {
                // Go through the numbers. Each damage type contains the value of that type at each tier
                for(let i=0; i<raw_dmg.damage.length; i++) {
                    let corr_dmg_tier_array = damage[i] ?? [];
                    corr_dmg_tier_array.push({
                        type: SerUtil.restrict_enum(DamageType, DamageType.Kinetic, raw_dmg.type),
                        val: `${raw_dmg.damage[i]}`
                    });
                    damage[i] = corr_dmg_tier_array; // No-op if already set. But sets if we hadn't yet
                }
            }

            // Same with range
            let range: RegRangeData[] = data.range?.map(r => ({
                type: SerUtil.restrict_enum(RangeType, RangeType.Range, r.type),
                val: `${r}`
            })) ?? [];

            let result_wep: RegNpcWeaponData = {
                ...defaults.NPC_WEAPON(),
                ...data,
                tags,
                accuracy: data.accuracy ?? [0, 0, 0],
                attack_bonus: data.attack_bonus ?? [0, 0, 0],
                damage,
                range
            };
            result = result_wep;
        } else {
            let result_trait: RegNpcTraitData = {
                ...defaults.NPC_TRAIT(),
                ...data,
                tags
            };
            result = result_trait;
        }

        return reg.get_cat(EntryType.NPC_FEATURE).create_live(ctx, result);
    }
}
