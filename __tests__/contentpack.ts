// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { EntryType, OpCtx,  OpCtx } from "../src/registry";
import { get_base_content_pack, parseContentPack } from '../src/io/ContentPackParser';
import { IContentPack, intake_pack } from '../src/classes/ContentPack';
import * as fs from "fs";
import { Damage } from "../src/class";
import { DamageType } from "../src/enums";

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

async function get_cp(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/ceebees_lcp.lcp");
    // let buff_string = buff.toString();
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
        expect(petrify.Tags.some(x => x.Tag.IsRecharging)).toBeTruthy();
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
});
