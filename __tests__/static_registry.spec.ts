import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, Registry, InventoriedRegEntry, EntryType } from "../src/registry";
import { Counter } from "../src/class";
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

describe("Counter", () => {
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


        let man = await c.create({
            id: "bmw",
            name: "Big Mech Weapons",
            dark: "black",
            light: "white",
            logo: "",
            quote: "My strongest weapons are too expensive for you, traveller.",
            description: "big gunz"
        });

        expect(man).toBeDefined();

        // Try retreiving raw 
        let raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeDefined();
        expect(raw!.id).toEqual("bmw");

        // Try retrieving by mmid
        expect(await c.lookup_mmid("bmw")).toBeDefined();
        expect(await c.lookup_mmid("zoop")).toBeNull(); // 5

        // Check listing of both types
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live()).length).toEqual(1);

        // Try modifying and saving
        man.ID = "smz";
        man.Description = "small gunz";
        await man.writeback();

        // Make sure writeback didn't break things in the live copy somehow.
        expect(man.ID).toEqual("smz");

        // Check listing of both types again
        expect((await c.list_raw()).length).toEqual(1);
        expect((await c.list_live()).length).toEqual(1); // 10

        // Check raw matches expected updated value
        raw = await c.get_raw(man.RegistryID);
        expect(raw).toBeDefined();
        expect(raw!.id).toEqual("smz");
        expect(raw!.description).toEqual("small gunz");

        // Delete it, make sure it is gone
        await man.destroy();
        expect((await c.list_raw()).length).toEqual(0); // 14
    });

    it("Initializes if given content packs", async () => {
        expect.assertions(2);
        let env = await init_basic_setup();
        expect(env).toBeDefined();

        // Should have items in every category. just check frames
        expect((await env.reg.get_cat(EntryType.FRAME).list_raw()).length).toEqual(4*7);
    });
});
