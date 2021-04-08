// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx , quick_relinker} from "../src/registry";
import { Counter, Frame, MechWeapon, Pilot, Talent } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { gist_io, cloud_sync } from "../src/funcs";
import { validate_props } from "../src/classes/key_util";

let DONKEY_KONG = "1152ee13a1143ba3e5439560fe207336";
let DEPLOYABLE_GUY = "674a75a9be41eaa32e0d4514b61af461";

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

describe("Pilots", () => {
    it("Creates a default pilot with all desired fields", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(true);

        let ctx = new OpCtx();
        let p = await s.reg.create_live(EntryType.PILOT, ctx);
        validate_props(p);
        expect(true).toBeTruthy();

    });

    it("Can import a fully-detailed pilot", async () => {
        expect.assertions(39);
        let s = await init_basic_setup(true);

        // Load the king
        let ctx = new OpCtx();
        let dk: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let dk_data = await gist_io.download_pilot(DONKEY_KONG);
        await cloud_sync(dk_data, dk, [s.reg]);
        dk = await dk.refreshed();

        // Some basics
        expect(dk.Name).toEqual("Kong");
        expect(dk.Callsign).toEqual("King");
        expect(dk.Background).toEqual("Jungle");
        expect(dk.History).toEqual("<p>The leader of the bunch</p>");
        expect(dk.TextAppearance).toEqual("<p>You know him well</p>"); // 5

        // Skills
        let skill_names = dk.Skills.map((s: string) => s.Name.toLowerCase());
        expect(skill_names.length).toEqual(4);
        expect(skill_names).toContain("assault");
        expect(skill_names).toContain("survive");
        expect(skill_names).toContain("threaten");
        expect(skill_names).toContain("coconutgun"); // 10

        // Talents
        let talent_names = dk.Talents.map((t: Talent) => t.Name.toLowerCase());
        expect(talent_names.length).toEqual(3);
        expect(talent_names).toContain("brawler");
        expect(talent_names).toContain("brutal");
        expect(talent_names).toContain("grease monkey"); // 14

        // Mech skills
        expect(dk.MechSkills.Hull).toEqual(2);
        expect(dk.MechSkills.Agi).toEqual(4);
        expect(dk.MechSkills.Sys).toEqual(2);
        expect(dk.MechSkills.Eng).toEqual(6); // 18


        // Loadout
        expect(dk.OwnedArmor.length).toEqual(1);
        expect(dk.OwnedWeapons.length).toEqual(1);
        expect(dk.OwnedGear.length).toEqual(2); // 21
        
        expect(dk.Loadout.Armor[0].Name.toLowerCase()).toEqual("light hardsuit");
        expect(dk.Loadout.Weapons[0]).toBeFalsy();
        expect(dk.Loadout.Weapons[1].Name.toLowerCase()).toEqual("medium signature");
        expect(dk.Loadout.Gear[0].Name.toLowerCase()).toEqual("smart scope");
        expect(dk.Loadout.Gear[1]).toBeFalsy();
        expect(dk.Loadout.Gear[2].Name.toLowerCase()).toEqual("omnihook"); // 27

        // Core bonuses
        expect(dk.CoreBonuses.length).toEqual(2);
        let cb_names = dk.CoreBonuses.map(c => c.Name.toLowerCase());
        expect(cb_names).toContain("universal compatibility");
        expect(cb_names).toContain("adaptive reactor"); // 30

        // Mechs
        let mechs = await dk.Mechs();
        expect(mechs.length).toEqual(3);
        let mech_names = mechs.map(c => c.Name.toLowerCase());
        expect(mech_names).toContain("retsacnal");
        expect(mech_names).toContain("gengar");
        expect(mech_names).toContain("the fool"); // 34
        // We don't peer too much deeper - leave that to other tests
        
        // Licenses
        expect(dk.Licenses.length).toEqual(2);
        let lan = dk.Licenses.find(f => f.Name == "LANCASTER");
        let geng = dk.Licenses.find(f => f.Name == "GENGHIS");
        expect(lan).toBeTruthy();
        expect(lan.CurrentRank).toEqual(2);
        expect(geng).toBeTruthy();
        expect(geng.CurrentRank).toEqual(3); // 39
    });

    it("Will insinuate mechs when it insinuates pilot", async () => {
        expect.assertions(5);
        let source = await init_basic_setup(true);
        let dest = await init_basic_setup(false);

        // Load the king
        let dk: Pilot = await source.reg.create_live(EntryType.PILOT, new OpCtx());
        let dk_data = await gist_io.download_pilot(DONKEY_KONG);
        await cloud_sync(dk_data, dk, [source.reg]);
        dk = await dk.refreshed();

        // Send him on his merry way
        let dest_kong = await dk.insinuate(dest.reg);

        // Do it by counts, easiest way to do it
        let ctx = new OpCtx();
        let dest_mechs = await dest.reg.get_cat(EntryType.MECH).list_live(ctx); // ought to have 3
        let dest_frames = await dest.reg.get_cat(EntryType.FRAME).list_live(ctx); // ought to have 0 - the frames are owned by the mechs
        let dest_weapons = await dest.reg.get_cat(EntryType.MECH_WEAPON).list_live(ctx); // ought to have 0 
        expect(dest_mechs.length).toEqual(3);
        expect(dest_frames.length).toEqual(0);
        expect(dest_weapons.length).toEqual(0); // 3

        // Make sure that the mechs do in fact have the items, though. Only both with a few
        let lanny = await dest_mechs.find((m: Mech) => m.Loadout.Frame.ID == "mf_lancaster");
        let lanny_inv = await lanny.get_inventory();
        let lanny_frames = await lanny_inv.get_cat(EntryType.FRAME).list_live(ctx);
        let lanny_weapons = await lanny_inv.get_cat(EntryType.MECH_WEAPON).list_live(ctx);
        expect(lanny_frames.length).toEqual(1);
        expect(lanny_weapons.length).toEqual(3); // 5
    });

    it("Will not create duplicate deployables", async () => {
        expect.assertions(3);
        let compendium = await init_basic_setup(true);
        let world = await init_basic_setup(false);

        // Create a few pilots to work with. Re-doing the same pilot will have nothing because after the first time nothing will really change
        let ctx = new OpCtx();
        let pilots: Pilot[] = await Promise.all([0,1,2].map(_ => world.reg.create_live(EntryType.PILOT, ctx)));
        let pilot_data = await gist_io.download_pilot(DEPLOYABLE_GUY);
        await cloud_sync(pilot_data, pilots[0], [compendium.reg]);

        // We should have 3 deployables in our world right now
        // p = await p.refreshed(ctx);
        let all_deployables = await world.reg.get_cat(EntryType.DEPLOYABLE).list_live(ctx);
        expect(all_deployables.length).toEqual(3);

        // If we sync again with a proper relinker, then we shouldn't get any more duplicates
        let hooks = {
            relinker: quick_relinker({
                key_pairs: [["ID", "lid"], ["Name", "name"]]
            })
        }
        await cloud_sync(pilot_data, pilots[1], [compendium.reg], hooks);

        // Check again - it's the same!
        all_deployables = await world.reg.get_cat(EntryType.DEPLOYABLE).list_live(ctx);
        expect(all_deployables.length).toEqual(3);

        // Now the contra-positive I guess - sync a 3rd time with no hooks, should end up with 6 deployables
        await cloud_sync(pilot_data, pilots[2], [compendium.reg]);

        // Oh no!
        all_deployables = await world.reg.get_cat(EntryType.DEPLOYABLE).list_live(ctx);
        expect(all_deployables.length).toEqual(6);
    });

});
