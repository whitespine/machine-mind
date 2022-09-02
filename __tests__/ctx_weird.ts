// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx, quick_relinker } from "../src/registry";
import { CoreBonus, Counter, Frame, MechSystem, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';

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

describe("OpCtx weird stuff", () => {
    it("Do readonly copies actually like, yknow, readonly", async () => {
        expect.assertions(8);
        let s = await init_basic_setup(true);
        let r = s.reg;

        let base_ctx = new OpCtx();

        // Just load all weapons
        let wep_cat = r.get_cat(EntryType.MECH_WEAPON);
        let fetched_weps = await wep_cat.list_live(base_ctx);

        // Make the readonly copy
        let der_ctx = await base_ctx.readonly_copy();

        // Pluck one in particular into each
        let base_mimic_gun = await wep_cat.lookup_lid_live(base_ctx, "mw_mimic_gun");
        let der_mimic_gun = await wep_cat.lookup_lid_live(der_ctx, "mw_mimic_gun");

        // Validate names match
        expect(base_mimic_gun.Name).toEqual("Mimic Gun");
        expect(der_mimic_gun.Name).toEqual("Mimic Gun");

        // Rename on base. It A: should work, and B: should be reflected by der since its the same object
        base_mimic_gun.Name = "newgun";
        expect(base_mimic_gun.Name).toEqual("newgun");
        expect(der_mimic_gun.Name).toEqual("newgun");

        // Expect failure if der renames
        expect(() => {der_mimic_gun.Name = "dontwork";}).toThrowError();

        // Change shouldn't have happened
        expect(base_mimic_gun.Name).toEqual("newgun");
        expect(der_mimic_gun.Name).toEqual("newgun");

        // But also, if we now fetch systems, they shouldn't be readonly
        let sys_cat = r.get_cat(EntryType.MECH_SYSTEM);
        let der_argo = await sys_cat.lookup_lid_live(der_ctx, "ms_argonaut_shield");

        expect(() => {der_argo.Name = "foobar";}).not.toThrowError();
    });

});
