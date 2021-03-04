
// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { CoreBonus, Range, Counter, Frame, Range, MechSystem, MechWeapon, Damage } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { DamageType, RangeType, WeaponSize } from "@src/enums";

type DefSetup = {
    reg: StaticReg;
    env: RegEnv;
}

async function init_basic_setup(include_base: boolean = true): Promise<DefSetup> {
    let env = new RegEnv();
    let reg = new StaticReg(env);

    if(include_base) {
        let bcp = get_base_content_pack();
        await intake_pack(bcp, reg);
    }

    return {env, reg};
}

describe("Items Miscellania", () => {
    it("Weapons bring in their size correctly", async () => {
        expect.assertions(4);
        let s = await init_basic_setup(true);
        let c = s.reg.get_cat(EntryType.MECH_WEAPON);
        let ctx = new OpCtx();

        let fold_knife = await c.lookup_mmid(ctx, "mw_fold_knife");
        let assault_rifle = await c.lookup_mmid(ctx, "mw_assault_rifle");
        let kinetic_hammer = await c.lookup_mmid(ctx, "mw_kinetic_hammer");
        let siege_cannon = await c.lookup_mmid(ctx, "mw_siege_cannon");

        expect(fold_knife.Size).toEqual(WeaponSize.Aux);
        expect(assault_rifle.Size).toEqual(WeaponSize.Main);
        expect(kinetic_hammer.Size).toEqual(WeaponSize.Heavy);
        expect(siege_cannon.Size).toEqual(WeaponSize.Superheavy);
    });

    it("Neuro-linked targeting works", async () => {
        expect.assertions(6);
        let s = await init_basic_setup(true);
        let guns = s.reg.get_cat(EntryType.MECH_WEAPON);
        let bots = s.reg.get_cat(EntryType.MECH);
        let pilots = s.reg.get_cat(EntryType.PILOT);
        let bonuses = s.reg.get_cat(EntryType.CORE_BONUS);
        let ctx = new OpCtx();

        // Create our actors
        let pilot = await pilots.create_live(ctx, {});
        let mech = await bots.create_live(ctx, {});
        mech.Pilot = pilot;
        await mech.writeback();

        // Fetch our items
        let global_ar = await guns.lookup_mmid(ctx, "mw_assault_rifle");
        let global_tk = await guns.lookup_mmid(ctx, "mw_tactical_knife");
        let global_nl = await bonuses.lookup_mmid(ctx, "cb_neurolink_targeting");

        // Put them in
        let mech_inv = await mech.get_inventory();
        let pilot_inv = await pilot.get_inventory();
        let mech_ar = await global_ar.insinuate(mech_inv);
        let mech_tk = await global_tk.insinuate(mech_inv);
        let pilot_nl = await global_nl.insinuate(pilot_inv);

        // Reload actors
        ctx = new OpCtx();
        pilot = await pilot.refreshed(ctx);
        mech = await mech.refreshed(ctx);

        // Now, the AR should have a range of 10+3 = 13 because of the nl targeting
        let ar_ranges = Range.calc_range_with_bonuses(mech_ar, mech_ar.SelectedProfile, mech);
        expect(ar_ranges.length).toEqual(1);
        expect(ar_ranges[0].RangeType).toEqual(RangeType.Range);
        expect(ar_ranges[0].Value).toEqual("13");

        // The tac knife should still be threat 1
        let tk_ranges = Range.calc_range_with_bonuses(mech_tk, mech_tk.SelectedProfile, mech);
        expect(tk_ranges.length).toEqual(1);
        expect(tk_ranges[0].RangeType).toEqual(RangeType.Threat);
        expect(tk_ranges[0].Value).toEqual("1");
    });

    it("Autopod isn't working but hopefully this test will tell us why", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(true);
        let guns = s.reg.get_cat(EntryType.MECH_WEAPON);
        let ctx = new OpCtx();

        let autopod = await guns.lookup_mmid(ctx, "mw_autopod");

        expect(!!autopod).toBeTruthy();
    });

    it("Damages combine properly", async () => {
        let a = [
            new Damage({
                type: DamageType.Kinetic,
                val: "2d6 + 3"
            }), 
            new Damage({
                type: DamageType.Energy,
                val: "1d6"
            })
        ];

        let b = [
            new Damage({
                type: DamageType.Energy,
                val: "1d6"
            }), 
            new Damage({
                type: DamageType.Burn,
                val: "1d6"
            })
        ];

        let c = Damage.CombineLists(a, b);
        expect(c[0].DamageType).toEqual(DamageType.Kinetic);
        expect(c[1].DamageType).toEqual(DamageType.Energy);
        expect(c[2].DamageType).toEqual(DamageType.Burn);
        expect(c[0].Value).toEqual("2d6 + 3");
        expect(c[1].Value).toEqual("1d6 + 1d6");
        expect(c[2].Value).toEqual("1d6");

    });

    it("Ranges combine properly", async () => {
        let a = [
            new Range({
                type: RangeType.Range,
                val: "10"
            }), 
            new Range({
                type: RangeType.Blast,
                val: "2"
            })
        ];

        let b = [
            new Range({
                type: RangeType.Range,
                val: "5"
            }), 
            new Range({
                type: RangeType.Blast,
                val: "1"
            }), 
            new Range({
                type: RangeType.Threat,
                val: "3"
            })
        ];

        let c = Range.CombineLists(a, b);
        expect(c[0].RangeType).toEqual(RangeType.Range);
        expect(c[1].RangeType).toEqual(RangeType.Blast);
        expect(c[2].RangeType).toEqual(RangeType.Threat);
        expect(c[0].Value).toEqual("10 + 5");
        expect(c[1].Value).toEqual("2 + 1");
        expect(c[2].Value).toEqual("3");
    });

    it("Frames shouldn't actually have tags anymore, weirdly enough", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(true);
        let frames = s.reg.get_cat(EntryType.FRAME);
        let ctx = new OpCtx();

        let balor: Frame = await frames.lookup_mmid(ctx, "mf_balor");

        expect(balor.CoreSystem.Tags.length).toEqual(0);
    });
});
