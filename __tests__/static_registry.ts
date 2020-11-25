// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { Counter, Frame, MechSystem, MechWeapon } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { DEFAULT_PILOT } from "../src/classes/default_entries";
import { validate_props } from "../src/classes/key_util";

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
    it("Initializes at all", () => {
        expect(init_basic_setup).toReturn;
    });

    it("Can retrieve all categories", async () => {
        let s = await init_basic_setup(false);
        for(let et of Object.values(EntryType)) {
            expect(s.reg.get_cat(et as EntryType)).toBeDefined();
        }
    });

    it("Can manipulate a very simple item", async () => {
        expect.assertions(14);
        let s = await init_basic_setup(false);
        let c = s.reg.get_cat(EntryType.MANUFACTURER);
        let ctx = new OpCtx();


        let man = await c.create_live(ctx, {
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

    it("Initializes if given content packs", async () => {
        expect.assertions(2);
        let env = await init_basic_setup();
        expect(env).toBeTruthy();

        // Should have items in every category. just check frames
        expect((await env.reg.get_cat(EntryType.FRAME).list_raw()).length).toEqual(4*7 + 1); // 7 by each manufacturer, 1 gms
    });

    it("Gets basic frame information right", async () => {
        expect.assertions(10);
        let env = await init_basic_setup();
        let ctx = new OpCtx();

        let ever: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_standard_pattern_i_everest")
        expect(ever).toBeTruthy();
        expect(ever.Name).toEqual("EVEREST")

        // Trivial
        expect(ever.Stats.armor).toEqual(0);
        expect(ever.Stats.sensor_range).toEqual(10); // that's enough I think

        // Traits are "items" in our system, so this is slightly more complex
        expect(ever.Traits[0].Name).toEqual("Initiative"); // 5
        expect(ever.Traits[1].Name).toEqual("Replaceable parts");
        expect(ever.Traits[1].Bonuses[0].Title).toEqual("Half Cost for Structure Repairs");

        // Check a lancaster - should have an integrated
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster")
        expect(lanny.CoreSystem).toBeTruthy();
        expect(lanny.CoreSystem.Integrated.length).toEqual(1);
        expect(lanny.CoreSystem.Integrated[0]).toBeInstanceOf(MechWeapon); // 10
    });



    it("Can create inventories things", async () => {
        expect.assertions(7);
        let env = await init_basic_setup();

        // make a pilot
        let ctx = new OpCtx();
        let pilots = env.reg.get_cat(EntryType.PILOT);
        let steve = await pilots.create_default(ctx);
        steve.Name = "Steve";
        let steve_inv = steve.get_inventory()

        // Inventory should be unique
        expect(steve_inv == env.reg).toBeFalsy();

        // Make an armor (in the global scope!)
        let armors = env.reg.get_cat(EntryType.PILOT_ARMOR);
        let global_armor = await armors.create_default(ctx);
        global_armor.Name = "Steve's global armor";
        await global_armor.writeback();

        // Insinuate the armor into steve's personal inventory
        let personal_armor = await global_armor.insinuate(steve_inv);

        // Moving reg's should've changed registry ids, barring hilariously bad luck
        expect(personal_armor.RegistryID == global_armor.RegistryID).toBeFalsy();
        expect(personal_armor.Registry == global_armor.Registry).toBeFalsy();
        expect(personal_armor.Registry == env.reg).toBeFalsy();
        expect(global_armor.Registry == steve.get_inventory()).toBeFalsy(); // 5

        // Change its name
        personal_armor.Name = "Steve's personal armor";
        await personal_armor.writeback();

        // Let's check our raws, to be sure what we wanted to change changed
        let old_raw = await env.reg.get_cat(EntryType.PILOT_ARMOR).get_raw(global_armor.RegistryID);
        let new_raw = await steve_inv.get_cat(EntryType.PILOT_ARMOR).get_raw(personal_armor.RegistryID); 
        expect(old_raw.name).toEqual("Steve's global armor"); 
        expect(new_raw.name).toEqual("Steve's personal armor"); // 7
        // Wowie zowie!
    });

    it("Properly re-finds the same live item", async () => {
        expect.assertions(5);
        let env = await init_basic_setup();

        // Oops! All lannies
        let ctx = new OpCtx();

        // Regardless of id resolution method we expect these to be the same
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster");
        let lenny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster"); // Double identical lookup via mmid
        expect(lanny === lenny).toBeTruthy();
        let larry: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx, lanny.RegistryID); // Repeat lookup by reg iD
        expect(lanny === larry).toBeTruthy();
        let harry: Frame = await env.reg.resolve_wildcard_mmid(ctx, "mf_lancaster");
        expect(lanny === harry).toBeTruthy();
        let terry: Frame = await env.reg.resolve(ctx, lanny.as_ref());
        expect(lanny === terry).toBeTruthy();

        // Does changing the ctx break it? (it should)
        let ctx_2 = new OpCtx();
        let gary: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx_2, lanny.RegistryID);
        expect(gary === lanny).toBeFalsy();
    });

    it("Can handle some more peculiar insinuation/ctx cases", async () => {
        let full_env = await init_basic_setup();
        let empty_env = await init_basic_setup(false);

        // Insinuate the lancaster from the full to the empty, using a refresh to ensure things remain cool
        let ctx = new OpCtx();
        let lanny: Frame = await full_env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster")
        let moved_lanny = await lanny.insinuate(empty_env.reg);
        let moved_ctx = moved_lanny.OpCtx;

        // Should share nothing in common
        expect(lanny === moved_lanny).toBeFalsy();
        expect(ctx === moved_ctx).toBeFalsy();
        expect(lanny.Registry === moved_lanny.Registry).toBeFalsy();
        expect(lanny.RegistryID === moved_lanny.RegistryID).toBeFalsy();

    });

    it("Can handle circular loops", async () => {
        let env = await init_basic_setup();

        let ctx = new OpCtx();
        // Make our pilot and mech
        let pilot = await env.reg.create_live(EntryType.PILOT, ctx);
        let mech = await env.reg.create_live(EntryType.MECH, ctx);

        // Make them friends
        pilot.Mechs.push(mech);
        mech.Pilot = pilot;
        
        // Write them back
        await pilot.writeback();
        await mech.writeback();

        // Read them back in a new ctx
        ctx = new OpCtx();
        let pilot = await env.reg.get_cat(EntryType.PILOT).create_default(ctx);

    });

    /*
    it("Properly generates implicit ids", async () => {
        expect.assertions(5);
        let env = await init_basic_setup();

        // Get our lanny
        let ctx = new OpCtx();
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_mmid(ctx, "mf_lancaster");

        // expect its core system and stuff to have generated reasonable names
        expect(lanny.CoreSystem.ID).toEqual("cs_lancaster_latch_drone");

        const trait_names = lanny.Traits.map(ft => ft.ID);
        expect(trait_names).toContain("ft_lancaster_combat_repair");
        expect(trait_names).toContain("ft_lancaster_insulated");
        expect(trait_names).toContain("ft_lancaster_redundant_systems"); // 4

        const drone_system: MechSystem = await env.reg.get_cat(EntryType.MECH_SYSTEM).lookup_mmid(ctx, "ms_restock_drone");
        const drone = drone_system.Deployables[0];
        expect(drone.ID).toEqual("dep_restock_drone"); // 5
    });
    */
    
});
