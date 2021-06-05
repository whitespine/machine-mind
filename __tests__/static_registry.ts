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
        expect.assertions(16);
        let s = await init_basic_setup(false);
        let c = s.reg.get_cat(EntryType.MANUFACTURER);
        let ctx = new OpCtx();


        let man = await c.create_live(ctx, {
            lid: "bmw",
            name: "Big Mech Weapons",
            dark: "black",
            light: "white",
            logo: "",
            quote: "My strongest weapons are too expensive for you, traveller.",
            description: "big gunz"
        });

        expect(man).toBeTruthy();

        // Make sure it has flags -- THIS IS NOW TESTED LATER -- IGNORE IT HERE, OLD API
        // expect(man.Flags?.test).toEqual("itworks");
        expect(true).toBeTruthy();

        // Try retreiving raw 
        let raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.lid).toEqual("bmw");

        // Try retrieving by lid
        expect(await c.lookup_lid_live(ctx, "bmw")).toBeTruthy();
        expect(await c.lookup_lid_live(ctx, "zoop")).toBeNull(); // 5

        // Try retrieving by lid in alternate ctx
        expect(await c.lookup_lid_live(new OpCtx(), "bmw")).toBeTruthy();

        // Check listing of both types
        expect(Array.from(await c.iter_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1);

        // Try modifying and saving
        man.LID = "smz";
        man.Description = "small gunz";
        await man.writeback();

        // Make sure writeback didn't break things in the live copy somehow.
        expect(man.LID).toEqual("smz");

        // Check listing of both types again
        expect(Array.from(await c.iter_raw()).length).toEqual(1);
        expect((await c.list_live(ctx)).length).toEqual(1); // 11

        // Check raw matches expected updated value
        raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeTruthy();
        expect(raw!.lid).toEqual("smz");
        expect(raw!.description).toEqual("small gunz");

        // Delete it, make sure it is gone
        await man.destroy_entry();
        expect(Array.from(await c.iter_raw()).length).toEqual(0); // 15
    });

    it("Initializes if given content packs", async () => {
        expect.assertions(2);
        let env = await init_basic_setup();
        expect(env).toBeTruthy();

        // Should have items in every category. just check frames
        let all_frames = await env.reg.get_cat(EntryType.FRAME).iter_raw();
        expect(Array.from(all_frames).length).toEqual(4*7 + 1); // 7 by each manufacturer, 1 gms
    });

    it("Gets basic frame information right", async () => {
        expect.assertions(10);
        let env = await init_basic_setup();
        let ctx = new OpCtx();

        let ever: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_standard_pattern_i_everest")
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
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_lancaster")
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
        let steve_inv = await steve.get_inventory()

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
        expect(global_armor.Registry == await steve.get_inventory()).toBeFalsy(); // 5

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
        expect.assertions(7);
        let env = await init_basic_setup();

        // Oops! All lannies
        let ctx = new OpCtx();

        // Regardless of id resolution method we expect these to be the same
        let lanny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_lancaster");
        lanny.Flags = "alpha"; // for later test
        let lenny: Frame = await env.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_lancaster"); // Double identical lookup via lid
        expect(lanny === lenny).toBeTruthy();
        let larry: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx, lanny.RegistryID); // Repeat lookup by reg iD
        expect(lanny === larry).toBeTruthy();
        let harry: Frame = await env.reg.resolve_wildcard_lid(ctx, "mf_lancaster");
        harry.Flags = "beta"; // for later test
        expect(lanny === harry).toBeTruthy();
        let terry: Frame = await env.reg.resolve(ctx, lanny.as_ref());
        expect(lanny === terry).toBeTruthy();

        // Do they all have the same flags? They should, and it should reflect our modification to harry
        expect(lanny.Flags == lenny.Flags && lanny.Flags == larry.Flags && lanny.Flags == harry.Flags && lanny.Flags == terry.Flags).toBeTruthy();
        expect(lanny.Flags).toEqual("beta");

        // Does changing the ctx break it? (it should)
        let ctx_2 = new OpCtx();
        let gary: Frame = await env.reg.get_cat(EntryType.FRAME).get_live(ctx_2, lanny.RegistryID);
        expect(gary === lanny).toBeFalsy();
    });

    it("Can handle some more peculiar insinuation/ctx cases", async () => {
        expect.assertions(5);
        let full_env = await init_basic_setup();
        let empty_env = await init_basic_setup(false);

        // Insinuate the lancaster from the full to the empty, using a refresh to ensure things remain cool
        let ctx = new OpCtx();
        let moved_ctx = new OpCtx();
        let lanny: Frame = await full_env.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_lancaster")
        lanny.Flags = "alpha";
        let moved_lanny = await lanny.insinuate(empty_env.reg, moved_ctx);
        
        // Modified shouldn't have carried over
        expect(moved_lanny.Flags).not.toEqual("alpha");

        // Should share nothing in common
        expect(lanny === moved_lanny).toBeFalsy(); // 2
        expect(ctx === moved_ctx).toBeFalsy(); 
        expect(lanny.Registry === moved_lanny.Registry).toBeFalsy(); 
        expect(lanny.RegistryID === moved_lanny.RegistryID).toBeFalsy(); // 5
    });

    it("Properly transfers inventory items while insinuating", async () => {
        expect.assertions(8);
        let source_env = await init_basic_setup(false);
        let dest_env = await init_basic_setup(false);

        // Create the pilot and give them a basic gun and some armor
        let ctx = new OpCtx();
        let source_pilot = await source_env.reg.create_live(EntryType.PILOT, ctx);

        // The gun, we build directly in the source pilot reg
        let source_gun = await source_pilot.get_inventory().then((i: Registry) => i.create_live(EntryType.PILOT_WEAPON, ctx));
        // The armor, we make then insinuate
        let source_world_armor = await source_env.reg.create_live(EntryType.PILOT_ARMOR, ctx);
        let source_pilot_armor = await source_world_armor.insinuate(await source_pilot.get_inventory());

        // Sanity check. Pilot should have one of each type. World should only have the single armor
        let check_ctx = new OpCtx();
        let source_pilot_check = await source_pilot.refreshed(check_ctx);
        expect(source_pilot_check.OwnedPilotWeapons.length).toEqual(1);
        expect(source_pilot_check.OwnedPilotArmor.length).toEqual(1);
        expect((await source_env.reg.get_cat(EntryType.PILOT_ARMOR).list_live(check_ctx)).length).toEqual(1);
        expect((await source_env.reg.get_cat(EntryType.PILOT_WEAPON).list_live(check_ctx)).length).toEqual(0); // 4

        // Ok here we go - do the transfer. Can just re-use source pilot - though it won't have the items visible in its fields, they have been stored in its reg
        let dest_pilot = await source_pilot.insinuate(dest_env.reg);

        // Did it bring its items?
        expect(source_pilot_check.OwnedPilotWeapons.length).toEqual(1);
        expect(source_pilot_check.OwnedPilotArmor.length).toEqual(1);

        // Dest reg should also not have any items in global space
        expect((await dest_env.reg.get_cat(EntryType.PILOT_ARMOR).list_live(check_ctx)).length).toEqual(0);
        expect((await dest_env.reg.get_cat(EntryType.PILOT_WEAPON).list_live(check_ctx)).length).toEqual(0); // 8
    });

    it("Can handle circular loops", async () => {
        expect.assertions(2);
        let env = await init_basic_setup();
        let ctx = new OpCtx();

        // Make two systems
        let sys_a = await env.reg.create_live(EntryType.MECH_SYSTEM, ctx, {});
        let sys_b = await env.reg.create_live(EntryType.MECH_SYSTEM, ctx, {});

        // Make them friends
        sys_a.Integrated.push(sys_b);
        sys_b.Integrated.push(sys_a);
        
        // Write back 
        await sys_a.writeback();
        await sys_b.writeback();

        // Read them back in a new ctx. If it doesn't crash, we're fine
        let new_ctx = new OpCtx();
        let resolved = await env.reg.get_cat(EntryType.MECH_SYSTEM).get_live(new_ctx, sys_a.RegistryID);

        expect(resolved.Integrated.length).toBe(1);
        expect(resolved.Integrated[0].Integrated.length).toBe(1);
    });

    it("Properly brings along child entries", async () => {
        expect.assertions(5);
        let src_env = await init_basic_setup(true);
        let dest_env = await init_basic_setup(false);

        // Dest env should be empty
        let ctx_orig = new OpCtx();
        let dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_orig);
        let dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_orig);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(0); // 2

        // Take the sherman, which has a native weapon
        let sherman = await src_env.reg.get_cat(EntryType.FRAME).lookup_lid_live(new OpCtx(), "mf_sherman");
        expect(sherman.CoreSystem.Integrated.length).toEqual(1); // 3

        // Send it over
        let dest_sherman = await sherman.insinuate(dest_env.reg);

        // Dest env should have one frame, one core, and one weapon now
        let ctx_final = new OpCtx();
        dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_final);
        dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_final);
        expect(dest_frames.length).toEqual(1);
        expect(dest_weapons.length).toEqual(1); // 5
    });

    it("Doesn't drag along parent entries", async () => {
        // Identical to above test, but we send over the solidcore
        expect.assertions(4);
        let source_env = await init_basic_setup(true);
        let dest_env = await init_basic_setup(false);

        // Dest env should be empty
        let ctx_orig = new OpCtx();
        let dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_orig);
        let dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_orig);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(0); // 2

        // Take the sherman, which has a native weapon, and send it over.
        let solidcore = await source_env.reg.get_cat(EntryType.MECH_WEAPON).lookup_lid_live(new OpCtx(), "mw_sherman_integrated");
        await solidcore.insinuate(dest_env.reg);

        // Dest env should have just the weapon. 
        let ctx_final = new OpCtx();
        dest_frames = await dest_env.reg.get_cat(EntryType.FRAME).list_live(ctx_final);
        dest_weapons = await dest_env.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx_final);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(1); // 4
    });
    
    it("Calls insinuation hooks (simple)", async () => {
        expect.assertions(5);
        const hooks =  {
            post_final_write(record, reg) {
                expect(record.type).toEqual(EntryType.MECH_SYSTEM);
                expect(old_sys.Name).toEqual("ns");
                expect(old_sys.Description).toEqual("alpha");
                expect(record.new_item.Name).toEqual("ns");
                expect(record.new_item.Description).toEqual("beta"); // Note the change from our other hook!
            },

            pre_final_write(record, reg) {
                // We can sorta do anything we want to finalize our conversion
                record.pending.Description = "beta";
            }
        };

        let env = new RegEnv();
        let reg1 = new StaticReg(env);
        let reg2 = new StaticReg(env);
        let ctx = new OpCtx();
        let old_sys = await reg1.create_live(EntryType.MECH_SYSTEM, ctx, {name: "ns", description: "alpha"});
        let new_sys = await old_sys.insinuate(reg2, null, hooks);
    });

    it("Calls insinuation hooks (insinuated)", async () => {
        expect.assertions(5 + 3);
        const hooks = {
            post_final_write(record, reg) {
                expect(true).toBeTruthy(); // Will be hit 5 times from insinuations

                // A bit more: if it is a frame, make sure it has its stuff
                if(record.type == EntryType.FRAME) {
                    expect(record.new_item.Traits.length).toEqual(2);
                    expect(record.new_item.CoreSystem.Deployables.length).toEqual(4);
                    expect(record.new_item.CoreSystem).toBeTruthy();
                }
            }
        };

        let src = await init_basic_setup(true);
        let dest = new StaticReg(src.env);
        let ctx = new OpCtx();

        // We plan on moving a frame, specifically the hydra. The hydra has 4 deployables, so totaling 5 expected insinuate hooks
        let drake = await src.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_hydra");
        await drake.insinuate(dest, null, hooks);
    });

    it("Properly redirects resolutions to different named regs", async () => {
        expect.assertions(2);
        let env = new RegEnv();
        let ctx = new OpCtx();
        let reg_a = new StaticReg(env, "a");
        let reg_b = new StaticReg(env, "b");

        // make a val in B
        let exp_val: CoreBonus = await reg_b.get_cat(EntryType.CORE_BONUS).create_live(ctx, {name: "foo"}); // Don't really care abt data
        let exp_val_ref = exp_val.as_ref();
        
        // Attempt to fetch from A
        let found_val: CoreBonus = await reg_a.resolve(new OpCtx(), exp_val_ref);

        // Initial write should still have the field
        expect(found_val.Name).toEqual("foo");

        // Should know that it belongs to B
        expect(found_val.Registry.name()).toEqual("b");
    });

    it("Properly resolves fallback lids", async () => {
        expect.assertions(4);

        // Create two setups
        let setup_alpha = await init_basic_setup(false);
        let setup_beta = await init_basic_setup(false);

        // For the purpose of this demonstration, they must have the same name
        setup_alpha.reg.set_name("comp");
        setup_beta.reg.set_name("comp");

        // Load in the cp's
        let bcp = get_base_content_pack();
        await intake_pack(bcp, setup_alpha.reg);
        await intake_pack(bcp, setup_beta.reg);

        // Delete the sherman from beta
        let ctx = new OpCtx();
        let beta_frames = await setup_beta.reg.get_cat(EntryType.FRAME).list_live(ctx);
        let beta_sherman = await setup_beta.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_sherman");
        await beta_sherman.destroy_entry();

        // We take the sherman from alpha and place its data (raw, unaffected) in beta
        let alpha_sherman = await setup_alpha.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_sherman");

        let new_beta_sherman = await setup_beta.reg.get_cat(EntryType.FRAME).create_live(ctx, alpha_sherman.save());

        // Assert that they have the same # of mechs, since though we deleted beta's sherman we immediately replaced it
        expect((await setup_alpha.reg.get_cat(EntryType.FRAME).list_live(ctx)).length).toEqual((await setup_beta.reg.get_cat(EntryType.FRAME).list_live(ctx)).length);

        // Now, the alpha sherman's manufacturer, targs, and integrated refs would typically have just been lost in transition
        // prior to recent changes to lid fallbacking. But now! They shouldn't! We assume that an incorrect id means use fallback lid, 
        // and that an invalid ref name just means use current
        let new_solidcore = new_beta_sherman.CoreSystem.Integrated[0];

        // It should exist, in spite of us not insinuating
        expect(new_solidcore != undefined).toBeTruthy();

        // The sherman should know it's from harrison armory (again, in spite of the ref not having been transitted normally)
        let new_man = new_beta_sherman.Source; // get yourself one
        expect(new_man.Name).toEqual("HARRISON ARMORY");

        // The solidcore should still have its ordnance tag
        expect(new_solidcore.SelectedProfile.Tags[0].Tag.Name).toEqual("ORDNANCE");

        // That's about it.
        // NOTE: We don't test deployables, because they don't work. And they can't! Because compcon spec doesn't provide any mechanism to specify a deployable id.
        // Could maybe gen some ourselves, but I'm holding off on that for now
    });

    it("Properly utilizes relinker", async () => {
        expect.assertions(8);

        // Create two setups
        let setup_source = new StaticReg(new RegEnv());
        let setup_dest = new StaticReg(new RegEnv());

        // Our experiment is as follows: We will have a pilot owning a gun and a free-floating system in source
        // We will insinuate them to dest, using a relinker callback that attempts to find pre-existing entries by name
        let ctx = new OpCtx();
        let source_pilot = await setup_source.create_live(EntryType.PILOT, ctx, {name: "steve"})
        let source_pilot_gun = await source_pilot.get_inventory().then(i => i.create_live(EntryType.PILOT_WEAPON, ctx, {name: "mr. gun"}));
        let source_system = await setup_source.create_live(EntryType.MECH_SYSTEM, ctx, {name: "mechsys"});
        source_pilot = await source_pilot.refreshed();

        // Insinuate them all to dest. This should produce a very mundane initial result.
        await source_pilot.refreshed().then(r => r.insinuate(setup_dest)); // Refresh so we know we own a weapon
        await source_system.insinuate(setup_dest);

        // We now expect one pilot, one system, and zero pilot weapons in the global space
        let dest_pilots = await setup_dest.get_cat(EntryType.PILOT).list_live(ctx);
        let dest_systems = await setup_dest.get_cat(EntryType.MECH_SYSTEM).list_live(ctx);
        let dest_weapons = await setup_dest.get_cat(EntryType.PILOT_WEAPON).list_live(ctx);
        expect(dest_pilots.length).toEqual(1);
        expect(dest_systems.length).toEqual(1);
        expect(dest_weapons.length).toEqual(0);

        // We also expect the pilot's inventory to contain exactly one weapon
        let pilots_weapons = await dest_pilots[0].get_inventory().then(i => i.get_cat(EntryType.PILOT_WEAPON).list_live(ctx));
        expect(pilots_weapons.length).toEqual(1);

        // -------------------------------------
        // To make matters more interesting, we give source pilot a second weapon with a different name. This one shouldn't get deduplicated, because it is new, even if the pilot and their first weapon are deduplicated!
        let source_pilot_second_gun = await source_pilot.get_inventory().then(i => i.create_live(EntryType.PILOT_WEAPON, ctx, {name: "mrs. gun"}));
        source_pilot = await source_pilot.refreshed();

        // Ok, now we do it again, with gusto! And by gusto i mean a relinker that attempts to find pre-existing items with the same name
        let hooks = {
            relinker: async (orig, _, dest_cat) => {
                for(let [k, v] of await dest_cat.raw_map().then(m => m.entries())) {
                    if(v.name == orig.Name) {
                        let tmp = await dest_cat.get_live(orig.OpCtx, k);
                        return tmp;
                    }
                } 
                return null;
            }
        };

        await source_pilot.insinuate(setup_dest, null, hooks);
        await source_system.insinuate(setup_dest, null, hooks);

        // We expect the same number of things as before in the global scope
        dest_pilots = await setup_dest.get_cat(EntryType.PILOT).list_live(ctx);
        dest_systems = await setup_dest.get_cat(EntryType.MECH_SYSTEM).list_live(ctx);
        dest_weapons = await setup_dest.get_cat(EntryType.PILOT_WEAPON).list_live(ctx);
        expect(dest_pilots.length).toEqual(1);
        expect(dest_systems.length).toEqual(1);
        expect(dest_weapons.length).toEqual(0);

        // Pilot should have exactly 2 weapons
        pilots_weapons = await dest_pilots[0].get_inventory().then(i => i.get_cat(EntryType.PILOT_WEAPON).list_live(ctx));
        expect(pilots_weapons.length).toEqual(2);
    });

    it("Duplicates if not using relinker", async () => {
        expect.assertions(9);

        // Create two setups
        let setup_source = new StaticReg(new RegEnv());
        let setup_dest = new StaticReg(new RegEnv());

        // Our experiment is as follows: We will have a pilot owning a gun and a free-floating system in source
        // We will insinuate them to dest, using a relinker callback that attempts to find pre-existing entries by name
        let ctx = new OpCtx();
        let source_pilot = await setup_source.create_live(EntryType.PILOT, ctx, {name: "steve"})
        let source_pilot_gun = await source_pilot.get_inventory().then(i => i.create_live(EntryType.PILOT_WEAPON, ctx, {name: "mr. gun"}));
        let source_system = await setup_source.create_live(EntryType.MECH_SYSTEM, ctx, {name: "mechsys"});
        source_pilot = await source_pilot.refreshed();

        // Insinuate them all to dest. This should produce a very mundane initial result.
        await source_pilot.refreshed().then(r => r.insinuate(setup_dest)); // Refresh so we know we own a weapon
        await source_system.insinuate(setup_dest);

        // We now expect one pilot, one system, and zero pilot weapons in the global space
        let dest_pilots = await setup_dest.get_cat(EntryType.PILOT).list_live(ctx);
        let dest_systems = await setup_dest.get_cat(EntryType.MECH_SYSTEM).list_live(ctx);
        let dest_weapons = await setup_dest.get_cat(EntryType.PILOT_WEAPON).list_live(ctx);
        expect(dest_pilots.length).toEqual(1);
        expect(dest_systems.length).toEqual(1);
        expect(dest_weapons.length).toEqual(0);

        // We also expect the pilot's inventory to contain exactly one weapon
        let pilots_weapons = await dest_pilots[0].get_inventory().then(i => i.get_cat(EntryType.PILOT_WEAPON).list_live(ctx));
        expect(pilots_weapons.length).toEqual(1);

        // -------------------------------------
        // To make matters more interesting, we give source pilot a second weapon with a different name. This one shouldn't get deduplicated, because it is new, even if the pilot and their first weapon are deduplicated!
        let source_pilot_second_gun = await source_pilot.get_inventory().then(i => i.create_live(EntryType.PILOT_WEAPON, ctx, {name: "mrs. gun"}));
        source_pilot = await source_pilot.refreshed();

        // THIS TIME: NO HOOKS!
        let hooks = {};

        await source_pilot.insinuate(setup_dest, null, hooks);
        await source_system.insinuate(setup_dest, null, hooks);

        // We expect the same number of things as before in the global scope
        dest_pilots = await setup_dest.get_cat(EntryType.PILOT).list_live(ctx);
        dest_systems = await setup_dest.get_cat(EntryType.MECH_SYSTEM).list_live(ctx);
        dest_weapons = await setup_dest.get_cat(EntryType.PILOT_WEAPON).list_live(ctx);
        expect(dest_pilots.length).toEqual(2);
        expect(dest_systems.length).toEqual(2);
        expect(dest_weapons.length).toEqual(0);

        // Pilots should have 1 and 2 weapons, respectively.
        pilots_weapons = await Promise.all(dest_pilots.map(p => p.get_inventory().then(i => i.get_cat(EntryType.PILOT_WEAPON).list_live(ctx))));
        expect(pilots_weapons[0].length).toEqual(1);
        expect(pilots_weapons[1].length).toEqual(2); // Note: ordering not usually guaranteed. Fine for a static test, though
     });

    it("Quick relinkers work as expected", async () => {
        expect.assertions(3);

        // Create two setups
        let setup_source = await init_basic_setup(true);
        let setup_dest = await init_basic_setup(true);

        // Moving a system from one to the other with proper relinking should not increment count
        let ctx = new OpCtx();
        let system = await setup_source.reg.get_cat(EntryType.MECH_SYSTEM).lookup_lid_live(ctx, "ms_neurospike");

        const get_dest_listing = async () => setup_dest.reg.get_cat(EntryType.MECH_SYSTEM).list_live(new OpCtx());
        const orig = await get_dest_listing();

        // Insinuate three ways. One using a quickrelinker targeting ids at the func call level. Then, modifying setup_dest to have an inbuilt relinking hook targeting names. Finally, one which deliberately blacklists the key(s)
        let id_relinker = quick_relinker({
            key_pairs: [["LID", "lid"]]
        });
        await system.insinuate(setup_dest.reg, null, {relinker: id_relinker});
        const p1 = await get_dest_listing();

        let name_relinker = quick_relinker({
            key_pairs: [["Name", "name"]]
        });
        setup_dest.reg.hooks.relinker = name_relinker;
        await system.insinuate(setup_dest.reg);
        const p2 = await get_dest_listing();

        let blacklist_id_relinker = quick_relinker({
            key_pairs: [["Name", "name"], ["LID", "lid"]], // Name will be checked first, but blacklist outprioritizes both. Should not relink
            blacklist: ["ms_neurospike"]
        });
        setup_dest.reg.hooks.relinker = blacklist_id_relinker;
        await system.insinuate(setup_dest.reg);
        const p3 = await get_dest_listing();

        // Only p3 should've gotten a new item, since it deliberately blocked relinking via the blacklist.
        // Though this is a contrived example, blacklisting can be useful if you want to relink everything except certain items (like integrated weaponry, if you are making duplicates of an item)
        expect(p1.length).toEqual(orig.length);
        expect(p2.length).toEqual(orig.length);
        expect(p3.length).toEqual(orig.length + 1);
    });

    it("Isn't doing that weird flag transferrence thing", async () => {
        expect.assertions(2);

        // Create two setups
        let setup = await init_basic_setup(true);
        let source = setup.reg;
        let dest = new StaticReg(setup.env, "Flaggy", () => ({
            arbitrary: "value"
        }));

        // Move an arbitrary item through
        let gms = await source.get_cat(EntryType.MANUFACTURER).lookup_lid_live(new OpCtx(), "GMS");
        let new_gms = await gms.insinuate(dest);
        expect(gms.Flags).toEqual({});
        expect(new_gms.Flags.arbitrary).toEqual("value");
    });

    it("Can handle true circularity", async () => {
        expect.assertions(8);

        // Create two setups
        let setup = await init_basic_setup(true);
        let reg = setup.reg;
        let ctx = new OpCtx();

        // Create all
        let pilot = await reg.get_cat(EntryType.PILOT).create_default(ctx);
        let mech = await reg.get_cat(EntryType.MECH).create_default(ctx);
        let deployable = await reg.get_cat(EntryType.DEPLOYABLE).create_default(ctx);
        let pilot_inv = await pilot.get_inventory();
        let system = await pilot_inv.get_cat(EntryType.MECH_SYSTEM).create_default(ctx);

        // Set appropriate properties to create a bad time :TM:
        await mech.Loadout.equip_system(system);
        mech.Pilot = pilot;
        deployable.Deployer = mech;
        system.Deployables.push(deployable);

        await mech.writeback();
        await deployable.writeback();
        await system.writeback();

        // reload mech in new ctx. Should not hang
        ctx = new OpCtx();
        expect(await pilot.refreshed(ctx)).toBeTruthy();

        // reload deployable in another new ctx. Should not hang
        ctx = new OpCtx();
        expect(await deployable.refreshed(ctx)).toBeTruthy();

        // reload mech in another new ctx. Should not hang
        ctx = new OpCtx();
        expect(await mech.refreshed(ctx)).toBeTruthy();

        // reload system in another new ctx. Should not hang
        ctx = new OpCtx();
        expect(await system.refreshed(ctx)).toBeTruthy();
        let x = await system.refreshed();

        // What if we rapid-fire refresh some weird pairings at once?
        ctx = new OpCtx();
        expect(await Promise.all([mech.refreshed(ctx), system.refreshed()])).toBeTruthy();

        ctx = new OpCtx();
        expect(await Promise.all([pilot.refreshed(ctx), system.refreshed()])).toBeTruthy();

        ctx = new OpCtx();
        expect(await Promise.all([system.refreshed(ctx), deployable.refreshed()])).toBeTruthy();

        ctx = new OpCtx();
        expect(await Promise.all([mech.refreshed(ctx), pilot.refreshed()])).toBeTruthy();
    });
});
