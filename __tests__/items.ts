
// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { CoreBonus, Counter, Frame, Range, MechSystem, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { RangeType, WeaponSize } from "../src/enums";

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
});
