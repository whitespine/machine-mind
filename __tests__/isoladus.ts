// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { Counter, Frame, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { DEFAULT_PILOT } from "../src/classes/default_entries";
import { validate_props } from "../src/classes/fill_test_util";

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

describe("Static Registry Reference implementation", () => {
    /*
    it("Can manipulate a very simple item", async () => {
        expect.assertions(14);
        let s = await init_basic_setup(false);
        let c = s.reg.get_cat(EntryType.MANUFACTURER);
        let ctx = new OpCtx();


        let man = await c.create(ctx, {
            id: "bmw",
            name: "Big Mech Weapons",
            dark: "black",
            light: "white",
            logo: "",
            quote: "My strongest weapons are too expensive for you, traveller.",
            description: "big gunz"
        });

        expect(man).toBeTruthy();

        // Try retreiving raw 
        let raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.id).toEqual("bmw");

        // Try retrieving by mmid
        expect(await c.lookup_mmid(ctx, "bmw")).toBeTruthy();
        expect(await c.lookup_mmid(ctx, "zoop")).toBeNull(); // 5

        // Check listing of both types
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1);

        // Try modifying and saving
        man.ID = "smz";
        man.Description = "small gunz";
        await man.writeback();

        // Make sure writeback didn't break things in the live copy somehow.
        expect(man.ID).toEqual("smz");

        // Check listing of both types again
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1); // 10

        // Check raw matches expected updated value
        raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.id).toEqual("smz");
        expect(raw!.description).toEqual("small gunz");

        // Delete it, make sure it is gone
        await man.destroy_entry();
        expect((await c.list_raw()).length).toEqual(0); // 14
    });
    */    

     it("Can handle circular loops", async () => {
        expect.assertions(1);

        let env = await init_basic_setup(false);

        let ctx = new OpCtx();
        // Make our pilot and mech
        let pilot = await env.reg.create(EntryType.PILOT, ctx);
        let mech = await env.reg.create(EntryType.MECH, ctx);
        console.log("Waiting to settled #####################################");
        await ctx.settled();

        console.log("Settled #####################################");
        // Make them friends
        pilot.Mechs.push(mech);
        mech.Pilot = pilot;
        
        // Write them back
        console.log("Writing 1 #####################################");
        await pilot.writeback();
        console.log("Writing 2 #####################################");
        await mech.writeback();

        // Read them back in a new ctx
        console.log("PERFORMING DANGER ########################");
        ctx = new OpCtx();
        pilot = (await env.reg.get_cat(EntryType.PILOT).list_live(ctx))[0];
        await ctx.settled();
        expect(pilot.Mechs[0].Pilot === pilot).toBeTruthy();
    });
});
