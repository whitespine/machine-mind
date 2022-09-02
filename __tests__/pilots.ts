// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx , quick_relinker} from "../src/registry";
import { Counter, Frame, MechLoadout, MechWeapon, Pilot, Talent } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { gist_io, cloud_sync } from "../src/funcs";
import { MountType } from "../src/enums";
import { validate_props } from "../src/classes/key_util";
import * as fs from "fs";
import { get_base_content_pack, parseContentPack } from '../src/io/ContentPackParser';
import { SyncHooks } from "../src/interface";

let DONKEY_KONG = "1152ee13a1143ba3e5439560fe207336";
let DEPLOYABLE_GUY = "674a75a9be41eaa32e0d4514b61af461";
let BARB = "764bcd352a463074f3ec1bd79486bd71";
let GRYGONS = "78d3c986d75b174f7a6627af63d6b24e";
let GRYGONS_WITH_EVERYTHING = "73f483f63ef9312010aa1c859fa0732e";
let MOUNT_MAN = "42d5ba11bfa0d9a371ac59a3af3cd874";

type DefSetup = {
    reg: StaticReg;
    env: RegEnv;
}

async function get_wallflower(): Promise<IContentPack> {
    let buff = await fs.promises.readFile("./__tests__/wallflower.lcp").catch(e => {
        console.error("To test, put the wallflower lcp at '__tests__/wallflower.lcp'. I haven't included it so people don't steal it or whatever");
        throw e;
    });
    // let buff_string = buff.toString();
    return parseContentPack(buff);
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
        expect(dk.OwnedPilotArmor.length).toEqual(1);
        expect(dk.OwnedPilotWeapons.length).toEqual(1);
        expect(dk.OwnedPilotGear.length).toEqual(2); // 21
        
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
        let lanny = await dest_mechs.find((m: Mech) => m.Loadout.Frame.LID == "mf_lancaster");
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
        let all_deployables = await world.reg.get_cat(EntryType.DEPLOYABLE).list_live(ctx);
        expect(all_deployables.length).toEqual(3);

        // If we sync again with a proper relinker, then we shouldn't get any more duplicates
        let hooks = {
            relinker: quick_relinker({
                key_pairs: [["LID", "lid"], ["Name", "name"]]
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

    it("Can import various pilots", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(true);

        // Load barb
        let ctx = new OpCtx();
        let barb: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let barb_data = await gist_io.download_pilot(BARB);
        await cloud_sync(barb_data, barb, [s.reg]);
        barb = await barb.refreshed();

        // Add it in
        let pack = await get_wallflower();
        await intake_pack(pack, s.reg);
        
        // Load grygons
        ctx = new OpCtx();
        let gry: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let gry_data = await gist_io.download_pilot(GRYGONS);
        await cloud_sync(gry_data, gry, [s.reg]);
        gry = await gry.refreshed();
        let gry_main = await gry.ActiveMech();
        expect(gry_main).toBeTruthy();
    });

    it("Calls all appropriate hooks", async () => {
        expect.assertions(19);
        let s = await init_basic_setup(true);

        // Our checklist
        let sat = {
            pilot: false,
            mech: false,
            mech_weapon: false,
            mech_system: false,
            frame: false, // 5

            core_bonus: false,
            pilot_weapon: false,
            pilot_armor: false,
            pilot_gear: false,
            loadout: false, // 10

            pilot_loadout: false,
            weapon_mount: false,
            weapon_mod: false,
            reserve: false,
            organization: false, // 15

            // faction: false,
            trigger: false,
            talent: false,
            license: false,
            deployable: true // 19
        };

        // Set our checklist to be proper
        let callbacks: SyncHooks = {
            sync_pilot(item, raw, is_new)  { sat.pilot = true; },
            sync_mech(item, raw, is_new)  { sat.mech = true; },
            sync_mech_weapon(item, raw, is_new)  { sat.mech_weapon = true; },
            sync_mech_system(item, raw, is_new)  { sat.mech_system = true; },
            sync_frame(item, raw, is_new)  { sat.frame = true; },
            sync_core_bonus(item, raw, is_new)  { sat.core_bonus = true; },
            sync_pilot_weapon(item, raw, is_new)  { sat.pilot_weapon = true; },
            sync_pilot_armor(item, raw, is_new)  { sat.pilot_armor = true; },
            sync_pilot_gear(item, raw, is_new)  { sat.pilot_gear = true; },
            sync_loadout(item, raw, is_new)  { sat.loadout = true; },
            sync_pilot_loadout(item, raw, is_new)  { sat.pilot_loadout = true; },
            sync_weapon_mount(item, raw, is_new)  { sat.weapon_mount = true; },
            sync_weapon_mod(item, raw, is_new)  { sat.weapon_mod = true; },
            sync_reserve(item, raw, is_new)  { sat.reserve = true; },
            // sync_faction(item, raw, is_new) => { sat.// faction = true; },
            sync_organization(item, raw, is_new)  { sat.organization = true; },
            sync_trigger(item, raw, is_new)  { sat.trigger = true; },
            sync_talent(item, raw, is_new)  { sat.talent = true; },
            sync_license(item, raw, is_new)  { sat.license = true; },
            sync_deployable_nosave(dep) { sat.deployable = true; }
        }

        // Load barb
        let ctx = new OpCtx();
        let pilot: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let pilot_data = await gist_io.download_pilot(GRYGONS_WITH_EVERYTHING);
        await cloud_sync(pilot_data, pilot, [s.reg], callbacks);

        // We expect everything in callbacks to be true
        expect(sat.pilot).toBeTruthy();
        expect(sat.mech).toBeTruthy();
        expect(sat.mech_weapon).toBeTruthy();
        expect(sat.mech_system).toBeTruthy();
        expect(sat.frame).toBeTruthy(); // 5

        expect(sat.core_bonus).toBeTruthy();
        expect(sat.pilot_weapon).toBeTruthy();
        expect(sat.pilot_armor).toBeTruthy();
        expect(sat.pilot_gear).toBeTruthy();
        expect(sat.loadout).toBeTruthy(); // 10

        expect(sat.pilot_loadout).toBeTruthy();
        expect(sat.weapon_mount).toBeTruthy();
        expect(sat.weapon_mod).toBeTruthy();
        expect(sat.reserve).toBeTruthy();
        expect(sat.organization).toBeTruthy(); // 15

            // faction: false,
        expect(sat.trigger).toBeTruthy();
        expect(sat.talent).toBeTruthy();
        expect(sat.license).toBeTruthy();
        expect(sat.deployable).toBeTruthy(); // 19
    });

    it("Handles core bonus mounts", async () => {
        expect.assertions(31);
        let s = await init_basic_setup(true);

        // Load the mountman
        let ctx = new OpCtx();
        let pilot: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let pilot_data = await gist_io.download_pilot(MOUNT_MAN);
        await cloud_sync(pilot_data, pilot, [s.reg]);
        pilot = await pilot.refreshed();

        // Check his shit. He should have 3 mechs
        let mechs = await pilot.Mechs();
        expect(mechs.length).toEqual(3)

        // Their names should be as follows
        expect(mechs[0].Name).toEqual("Court In Session");
        expect(mechs[1].Name).toEqual("Gotta Leave Somebody Behind");
        expect(mechs[2].Name).toEqual("Fluctuating Values"); // 4

        // Strip their loadouts
        let ml0: MechLoadout = mechs[0].Loadout;
        let ml1: MechLoadout = mechs[1].Loadout;
        let ml2: MechLoadout = mechs[2].Loadout;

        // Verify mount counts
        expect(ml0.WepMounts.length).toEqual(4);
        expect(ml1.WepMounts.length).toEqual(5);
        expect(ml2.WepMounts.length).toEqual(4); // 7

        // Verify mount types
        expect(ml0.WepMounts[0].MountType).toEqual(MountType.Integrated);
        expect(ml0.WepMounts[1].MountType).toEqual(MountType.MainAux);
        expect(ml0.WepMounts[2].MountType).toEqual(MountType.Flex);
        expect(ml0.WepMounts[3].MountType).toEqual(MountType.Heavy); // 11

        expect(ml1.WepMounts[0].MountType).toEqual(MountType.Integrated);
        expect(ml1.WepMounts[1].MountType).toEqual(MountType.Integrated);
        expect(ml1.WepMounts[2].MountType).toEqual(MountType.MainAux);
        expect(ml1.WepMounts[3].MountType).toEqual(MountType.Main);
        expect(ml1.WepMounts[4].MountType).toEqual(MountType.Heavy); // 16

        expect(ml2.WepMounts[0].MountType).toEqual(MountType.Integrated);
        expect(ml2.WepMounts[1].MountType).toEqual(MountType.Flex);
        expect(ml2.WepMounts[2].MountType).toEqual(MountType.Main);
        expect(ml2.WepMounts[3].MountType).toEqual(MountType.Main); // 20

        // Verify weapon configurations. But just for one, i'm not completely masochistic
        expect(ml1.WepMounts[0].Weapons.length).toEqual(1);
        expect(ml1.WepMounts[0].Weapons[0].Name).toEqual("ZF4 SOLIDCORE"); // 22

        expect(ml1.WepMounts[1].Weapons.length).toEqual(1);
        expect(ml1.WepMounts[1].Weapons[0].Name).toEqual("Tactical Knife");

        expect(ml1.WepMounts[2].Weapons.length).toEqual(2);
        expect(ml1.WepMounts[2].Weapons[0].Name).toEqual("Annihilator");
        expect(ml1.WepMounts[2].Weapons[1].Name).toEqual("Thermal Pistol"); // 27

        expect(ml1.WepMounts[3].Weapons.length).toEqual(1);
        expect(ml1.WepMounts[3].Weapons[0].Name).toEqual("Mortar");

        expect(ml1.WepMounts[4].Weapons.length).toEqual(1);
        expect(ml1.WepMounts[4].Weapons[0].Name).toEqual("Heavy Machine Gun"); // 31
    });
});
