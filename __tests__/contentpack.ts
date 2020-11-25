// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { OpCtx,  OpCtx } from "../src/registry";
import { get_base_content_pack, parseContentPack } from '../src/io/ContentPackParser';
import { IContentPack, intake_pack } from '../src/classes/ContentPack';
import * as fs from "fs";

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
        
        let frames = await s.reg.get_cat("frame").list_live(ctx);
        expect(frames.length).toEqual(29 + 4);
        let frame_names = frames.map(f => f.Name);
        expect(frame_names).toContain("NORFOLK");
        expect(frame_names).toContain("LUNAMOTH");
        expect(frame_names).toContain("DJINN");
        expect(frame_names).toContain("GAIUS"); // 5
    });
});
