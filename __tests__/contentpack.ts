// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { EntryType, OpCtx,  OpCtx } from "../src/registry";
import { get_base_content_pack, parseContentPack } from '../src/io/ContentPackParser';
import { IContentPack, intake_pack } from '../src/classes/ContentPack';
import * as fs from "fs";
import { Damage, MechWeapon } from "../src/class";
import { DamageType } from "@src/enums";

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

// Get a content pack for testing. Here we use an lcp kindly contributed by Ceebees (thank you!)
async function get_cp(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/ceebees_lcp.lcp");
    return parseContentPack(buff);
}

async function get_suldan(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/suldan.lcp").catch(e => {
        console.error("To test, put the npcs lcp at '__tests__/suldan.lcp'. I haven't included it so people don't steal it or whatever");
        throw e;
    });
;
    return parseContentPack(buff);
}

async function get_npc_cp(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/npcs.lcp").catch(e => {
        console.error("To test, put the npcs lcp at '__tests__/npcs.lcp'. I haven't included it so people don't steal it or whatever");
        throw e;
    });
    // let buff_string = buff.toString();
    return parseContentPack(buff);
}

async function get_long_rim(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/longrim.lcp").catch(e => {
        console.error("To test, put the npcs lcp at '__tests__/longrim.lcp'. I haven't included it so people don't steal it or whatever");
        throw e;
    });
    // let buff_string = buff.toString();
    return parseContentPack(buff);
}

describe("Content pack handling", () => {
    it("Can host a solo content pack", async () => {
        expect.assertions(5);
        let s = await init_basic_setup(false);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_cp();
        await intake_pack(pack, s.reg);
        
        let frames = await s.reg.get_cat("frame").list_live(ctx);
        expect(frames.length).toEqual(4);
        let frame_names = frames.map(f => f.Name);
        expect(frame_names).toContain("NORFOLK");
        expect(frame_names).toContain("LUNAMOTH");
        expect(frame_names).toContain("DJINN");
        expect(frame_names).toContain("GAIUS"); // 5

    });

    it("Plays nice with existing data", async () => {
        // Same as above, but with base frames as well
        expect.assertions(5);
        let s = await init_basic_setup(true);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_cp();
        await intake_pack(pack, s.reg);
        
        let frames = await s.reg.get_cat(EntryType.FRAME).list_live(ctx);
        expect(frames.length).toEqual(29 + 4);
        let frame_names = frames.map(f => f.Name);
        expect(frame_names).toContain("NORFOLK");
        expect(frame_names).toContain("LUNAMOTH");
        expect(frame_names).toContain("DJINN");
        expect(frame_names).toContain("GAIUS"); // 5
    });    
    
    it("Gives everything a proper manufacturer", async () => {
        let s = await init_basic_setup(true);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_long_rim();
        await intake_pack(pack, s.reg);

        for(let et of [EntryType.FRAME, EntryType.CORE_BONUS, EntryType.MECH_WEAPON, EntryType.MECH_SYSTEM, EntryType.WEAPON_MOD, EntryType.LICENSE]) {
            let all = await s.reg.get_cat(et).list_live(ctx);
            for(let i of all) {
                // Some will not
                if([
                    "mw_fuel_rod_gun", 
                    "mw_prototype_1", 
                    "mw_prototype_2", 
                    "mw_prototype_3", 
                    "mw_lancaster_integrated", 
                    "mw_raleigh_integrated", 
                    "mw_sherman_integrated", 
                    "mw_barbarossa_integrated", 
                    "mw_caliban_integrated",
                    "ms_technophile_1", 
                    "ms_technophile_2", 
                    "ms_technophile_3", 
                    "ms_walking_armory_1", 
                    "ms_walking_armory_2", 
                    "ms_walking_armory_3", 
                    "ms_spaceborn_1", 
                ].includes(i.LID)) {
                    continue;
                }
                expect(i.Source).toBeTruthy();
            }
        }
    });

    it("Generates deployable ids in a reasonable way", async () => {
        // Same as above, but with base frames as well
        expect.assertions(6);
        let s = await init_basic_setup(true);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_cp();
        await intake_pack(pack, s.reg);

        // Grab a system with a deployable
        let eagle = await s.reg.get_cat(EntryType.MECH_SYSTEM).lookup_lid_live(ctx, "ms_legion_eagle");

        // Assert that it has its deployable, and that the deployable is named as we expect it to be
        expect(eagle).toBeTruthy();
        expect(eagle.Deployables.length).toEqual(1);
        expect(eagle.Deployables[0].LID).toEqual("dep_ms_legion_eagle_legion_standard");

        // Also check something from core data
        let hive = await s.reg.get_cat(EntryType.MECH_SYSTEM).lookup_lid_live(ctx, "ms_hive_drone");

        // Assert that it has its deployable, and that the deployable is named as we expect it to be
        expect(hive).toBeTruthy();
        expect(hive.Deployables.length).toEqual(1);
        expect(hive.Deployables[0].LID).toEqual("dep_ms_hive_drone_hive_drone");
    });

    it("Can load npc data as well", async () => {
        expect.assertions(26);
        let s = await init_basic_setup(true);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_npc_cp();
        await intake_pack(pack, s.reg);
        
        // Check that at least the lengths are correct
        let classes = await s.reg.get_cat(EntryType.NPC_CLASS).list_live(ctx);
        expect(classes.length).toEqual(33); // 33 classes in the base pack

        let features = await s.reg.get_cat(EntryType.NPC_FEATURE).list_live(ctx);
        expect(features.length).toEqual(414); // 414 features in the base pack

        let templates = await s.reg.get_cat(EntryType.NPC_TEMPLATE).list_live(ctx);
        expect(templates.length).toEqual(12); // 414 features in the base pack
        // 3

        // Check that an arbitrary class has all of its features accounted for
        let witch = classes.find(c => c.Name.toLowerCase() == "witch");
        expect(witch != null).toBeTruthy();

        // Has 4 base features, 5 optionals
        expect(witch.BaseFeatures.length).toEqual(4);
        expect(witch.OptionalFeatures.length).toEqual(5);
        // 6

        // One optional feature, petrify, should be a full tech with no accuracy, and a 2/4/6 attack bonus, and the recharge tag
        let petrify = witch.OptionalFeatures.find(f => f.Name.toLowerCase() == "petrify");
        expect(petrify != null).toBeTruthy();

        expect(petrify.Accuracy).toEqual([0,0,0]);
        expect(petrify.AttackBonus).toEqual([2,4,6]);
        expect(petrify.Tags.some(x => x.Tag.IsRecharge)).toBeTruthy();
        // 10

        // Now Check the berserker, focusing on its chain axe
        let berserker = classes.find(c => c.Name.toLowerCase() == "berserker");
        expect(berserker != null).toBeTruthy();

        // Has 4 base features, 5 optionals
        expect(berserker.BaseFeatures.length).toEqual(4);
        expect(berserker.OptionalFeatures.length).toEqual(5);
        // 13

        // One base feature, chain axe, should be a heavy melee tech with no accuracy, 
        // and a 1/2/3 attack bonus, and 7/9/11 kinetic damage
        let chain_axe = berserker.BaseFeatures.find(f => f.Name.toLowerCase() == "chain axe");
        expect(chain_axe != null).toBeTruthy();

        expect(chain_axe.Accuracy).toEqual([0,0,0]);
        expect(chain_axe.AttackBonus).toEqual([1,2,3]);
        // 16

        expect(chain_axe.Damage[0][0].DamageType).toEqual(DamageType.Kinetic);
        expect(chain_axe.Damage[0][0].Value).toEqual("7");
        expect(chain_axe.Damage[1][0].DamageType).toEqual(DamageType.Kinetic);
        expect(chain_axe.Damage[1][0].Value).toEqual("9");
        expect(chain_axe.Damage[2][0].DamageType).toEqual(DamageType.Kinetic);
        expect(chain_axe.Damage[2][0].Value).toEqual("11");
        // 22

        // Check an arbitrary template just for the lengths of arrays.
        // These tests are pretty rough, admittedly. 
        let exotic = templates.find(t => t.Name.toLowerCase() == "exotic");
        expect(exotic != null).toBeTruthy();

        // Has 3 base features, 7 optionals
        expect(exotic.BaseFeatures.length).toEqual(3);
        expect(exotic.OptionalFeatures.length).toEqual(7);
        // 25

        // Test some random other fields, lol
        expect(exotic.Description).toEqual("Even in a galaxy of wonders, Exotics are strange and dangerous enemies. Some feature unique technologies not yet available to the wider galaxy or wield archaic weapon styles updated to the modern day, while others carry equipment or adopt tactics that are totally alien to Union doctrine.");
        //26
    });    
    
    it("Can load suldan", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(false);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_suldan();
        await intake_pack(pack, s.reg);
        let weapons = await s.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx);
        expect(weapons.find(w => w.LID == "fgtsmw_colony_nexus")).toBeTruthy();
        
        /*
        let frames = await s.reg.get_cat("frame").list_live(ctx);
        expect(frames.length).toEqual(4);
        let frame_names = frames.map(f => f.Name);
        expect(frame_names).toContain("NORFOLK");
        expect(frame_names).toContain("LUNAMOTH");
        expect(frame_names).toContain("DJINN");
        expect(frame_names).toContain("GAIUS"); // 5
        */
    });

    it("Can load long rim, and process its alternate weapon profile structure", async () => {
        expect.assertions(4);
        let s = await init_basic_setup(false);
        let ctx = new OpCtx();

        // Add it in
        let pack = await get_long_rim();
        await intake_pack(pack, s.reg);
        let weapons = await s.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx);
        let cannibal: MechWeapon = weapons.find(w => w.LID == "mw_hhs_155_cannibal");
        let flayer: MechWeapon = weapons.find(w => w.LID == "mw_caliban_integrated");
        expect(cannibal).toBeTruthy();
        expect(flayer).toBeTruthy();
        expect(cannibal.Profiles.some(p => p.WepType != "CQB")).toBeFalsy();
        expect(flayer.Profiles.some(p => p.WepType != "CQB")).toBeFalsy();
    });

    it("Properly filters when importing", async () => {
        expect.assertions(2);
        let s = await init_basic_setup(false);
        let ctx = new OpCtx();

        // Do base
        let pack = await get_long_rim();
        await intake_pack(pack, s.reg);

        // Count frames
        let orig_frames = await s.reg.get_cat(EntryType.FRAME).list_live(ctx);
        let frame_cnt = orig_frames.length;

        // Import again
        await intake_pack(pack, s.reg);

        // Check again. Expect double
        let dub_frames = await s.reg.get_cat(EntryType.FRAME).list_live(ctx);
        let dub_frame_cnt = dub_frames.length;

        expect(dub_frame_cnt).toEqual(frame_cnt * 2);

        // Import once more, this time filtering for duplicates
        await intake_pack(pack, s.reg, (t, v) => {
            return !orig_frames.find(f => f.LID == v.lid);    
        });

        // Check again. Expect same as before
        let trip_frames = await s.reg.get_cat(EntryType.FRAME).list_live(ctx);
        let trip_frame_cnt = trip_frames.length;

        expect(trip_frame_cnt).toEqual(dub_frame_cnt);
    });



});
