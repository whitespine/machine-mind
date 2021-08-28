// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { get_base_content_pack, parseContentPack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import * as fs from "fs";
import { Npc, npc_cloud_sync } from "../src/classes/npc/Npc";

type DefSetup = {
    reg: StaticReg;
    env: RegEnv;
}

async function get_npc_cp(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/npcs.lcp");
    return parseContentPack(buff);
}

async function init_basic_setup(): Promise<DefSetup> {
    let env = new RegEnv();
    let reg = new StaticReg(env);

    let bcp = get_base_content_pack();
    await intake_pack(bcp, reg);
    let ncp = await get_npc_cp();
    await intake_pack(ncp, reg);

    return {env, reg};
}

function check_opfor(npc: Npc) {
    expect(npc).toBeTruthy();
    expect(npc.Name).toEqual("Opfor");
    expect(npc.Summary).toEqual("summmmm");
    expect(npc.Note).toEqual("<p>dasdasd</p>");
    expect(npc.Tier).toEqual(2); // 5

    expect(true).toBeTruthy(); // replacing an old test
    expect(npc.Tag).toEqual("Vehicle");
    expect(npc.Campaign).toEqual("test");
    expect(npc.Classes.length).toEqual(1);
    expect(npc.ActiveClass.Name).toEqual("OPERATOR"); // 10

    expect(npc.BaseClassFeatures.length).toEqual(4);
    expect(npc.SelectedClassFeatures.length).toEqual(1); // A customized version of fortress
    expect(npc.SelectedClassFeatures[0].Name).toEqual("ddddd"); // A customized version of fortress
    expect(npc.BaseTemplateFeatures.length).toEqual(2 + 9); // 2 from mercenary, 9 from ultra (dear god, why so many). Would be 10 form ultra, but I deliberately removed REFLEX
    expect(npc.SelectedTemplateFeatures.length).toEqual(2); // 1 from mercenary, 1 from ultra.   // 15

    // Stat check!
    expect(npc.Hull).toEqual(3);
    expect(npc.Agi).toEqual(3);
    expect(npc.Sys).toEqual(3);
    expect(npc.Eng).toEqual(3); // Maybe operator wasn't the best choice for this...
    expect(npc.MaxStructure).toEqual(4);  // 20

    expect(npc.CurrentStructure).toEqual(4);
    expect(npc.MaxStress).toEqual(4);
    expect(npc.CurrentStress).toEqual(4);
    expect(npc.MaxHP).toEqual(17);
    expect(npc.CurrentHP).toEqual(17); // 25

    expect(npc.CurrentHeat).toEqual(0);
    expect(npc.HeatCapacity).toEqual(8);
    expect(npc.Speed).toEqual(5);
    expect(npc.SaveTarget).toEqual(12);
    expect(npc.Evasion).toEqual(12); // 30

    expect(npc.EDefense).toEqual(16);
    expect(npc.SensorRange).toEqual(10);
    expect(npc.Activations).toEqual(2);
    expect(npc.Size).toEqual(1);
    expect(npc.Burn).toEqual(0); // 35
}

describe("Npcs", () => {
    it("Can be imported from JSON export", async () => {
        expect.assertions(35);
        let s = await init_basic_setup();

        // Make an npc
        let ctx = new OpCtx();
        let npc: Npc = await s.reg.create_live(EntryType.NPC, ctx);

        // Sync with our sample data
        let sample_data_json_raw = fs.readFileSync("./__tests__/sample_npc.json").toString();
        let sample_data_json = JSON.parse(sample_data_json_raw);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);

        // Well, we got this far at least. Make sure everything is as we expect it
        check_opfor(npc);
    });

    it("Doesn't get weird with repeat imports", async () => {
        expect.assertions(35);
        let s = await init_basic_setup();

        // Make an npc
        let ctx = new OpCtx();
        let npc: Npc = await s.reg.create_live(EntryType.NPC, ctx);

        // Sync with our sample data
        let sample_data_json_raw = fs.readFileSync("./__tests__/sample_npc.json").toString();
        let sample_data_json = JSON.parse(sample_data_json_raw);

        // AGAIN. AGAIN!
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);
        npc = await npc_cloud_sync(sample_data_json, npc, [s.reg]);

        // Well, we got this far at least. Make sure everything is as we expect it
        check_opfor(npc);
    });
});
