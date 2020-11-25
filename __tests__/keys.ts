// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { Counter, Frame, MechSystem, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { DEFAULT_PILOT } from "../src/classes/default_entries";
import { validate_props, trimmed } from "../src/classes/key_util";
import { defaults } from "../src/funcs";

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

describe("Key trimming functionality", () => {
    it("Removes extcess data", async () => {
        expect.assertions(3 * Object.values(EntryType).length);

        for(let k of Object.values(EntryType)) {
            let defaulter = defaults.DEFAULT_FUNC_MAP[k];
            let base = defaulter();
            let augmented = defaulter();
            augmented["bozo"] = "not even supposed to BE here";

            // Should have one more
            expect(Object.keys(augmented).length).toEqual(Object.keys(base).length + 1);

            // But shouldn't when we trim
            expect(Object.keys(trimmed(k, augmented)).length).toEqual(Object.keys(base).length);

            // trimming shouldn't affect base
            expect(Object.keys(trimmed(k, base)).length).toEqual(Object.keys(base).length);
        }

    });



    it("All core items have all keys", async () => {
        // expect.assertions(7);
        let env = await init_basic_setup();
        let ctx = new OpCtx();
        for(let k of Object.values(EntryType)) {
            let cat = env.reg.get_cat(k);
            for(let x of await cat.list_live(ctx)) {
                validate_props(x);
            }
        }
    });

    it("All default items have all keys", async () => {
        // expect.assertions(7);
        let env = await init_basic_setup(false);
        let ctx = new OpCtx();
        let ctx2 = new OpCtx();

        // Make a default of each type, then check keys
        for(let k of Object.values(EntryType)) {
            let newv = await env.reg.create_live(k, ctx);

            // See that it is all there
            validate_props(newv);
            
            // Save and reload
            await newv.writeback();
            let newv2 = await env.reg.get_live(k, ctx2, newv.RegistryID);
            validate_props(newv2);
        }
    });


});
