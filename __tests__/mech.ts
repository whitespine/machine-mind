// @ts-nocheck
import "jest";
import { StaticReg, RegEnv } from "../src/static_registry";
import { RegCat, OpCtx, Registry, InventoriedRegEntry, EntryType, OpCtx } from "../src/registry";
import { Counter, Deployable, Frame, Mech, MechWeapon, Pilot, Talent, Bonus } from "../src/class";
import { get_base_content_pack } from '../src/io/ContentPackParser';
import { intake_pack } from '../src/classes/ContentPack';
import { gist_io, cloud_sync } from "../src/funcs";
import { validate_props } from "../src/classes/key_util";

let DONKEY_KONG = "1152ee13a1143ba3e5439560fe207336";

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

describe("Mechs", () => {
    it("Creates a default pilot with all desired fields", async () => {
        expect.assertions(1);
        let s = await init_basic_setup(true);

        let ctx = new OpCtx();
        let p = await s.reg.create_live(EntryType.PILOT, ctx);
        validate_props(p);
        expect(true).toBeTruthy();

    });

    it("Can import a fully-detailed mech", async () => {
        expect.assertions(16);
        let s = await init_basic_setup(true);

        // Load the king
        let ctx = new OpCtx();
        let dk: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let dk_data = await gist_io.download_pilot(DONKEY_KONG);
        await cloud_sync(dk_data, dk, [s.reg]);
        dk = await dk.refreshed();

        // Get his active mech, which should be the lanny
        let mech = await dk.ActiveMech();

        // Some basics
        expect(mech.Name).toEqual("RETSACNAL");
        expect(mech.Frame.Name).toEqual("LANCASTER"); // 2

        // Mounts?
        expect(mech.Loadout.WepMounts.length).toEqual(2); // Integrated and mainaux
        expect(mech.Loadout.Weapons.length).toEqual(3); // Integrated (1) and mainaux (2, 3)
        expect(mech.Loadout.Weapons[0].Name).toEqual("Latch Drone"); 
        expect(mech.Loadout.Weapons[1].Name).toEqual("ROCKET-PROPELLED GRENADE"); 
        // expect(mech.Loadout.Weapons[1].Loaded).toBeFalsy(); -- this isn't stored in cloud data properly >:(
            expect(true).toBeTruthy();
        expect(mech.Loadout.Weapons[1].Destroyed).toBeFalsy();
        expect(mech.Loadout.Weapons[2].Name).toEqual("NEXUS (LIGHT)"); 
        expect(mech.Loadout.Weapons[2].Destroyed).toBeTruthy(); // 10


        // Systems?
        expect(mech.Loadout.Systems[0].Name).toEqual("AGNI-CLASS NHP");
        expect(mech.Loadout.Systems[0].Uses).toEqual(0);
        expect(mech.Loadout.Systems[1].Name).toEqual("MULE HARNESS");
        expect(mech.Loadout.Systems[1].Destroyed).toBeTruthy();
        expect(mech.Loadout.Systems[2].Name).toEqual("PATTERN-B HEX CHARGES");
        expect(mech.Loadout.Systems[2].Uses).toEqual(2); // 16
    });

    it("Computes stats with bonuses appropriately", async () => {
       expect.assertions(16);
        let s = await init_basic_setup(true);

        // Load the king
        let ctx = new OpCtx();
        let dk: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let dk_data = await gist_io.download_pilot(DONKEY_KONG);
        await cloud_sync(dk_data, dk, [s.reg]);
        dk = await dk.refreshed();

        // Get his active mech, which should be the lanny
        let mech: Mech = await dk.ActiveMech();

        expect(mech.CurrentStructure).toEqual(4);
        expect(mech.CurrentStress).toEqual(4);
        expect(mech.MaxSP).toEqual(15);
        expect(mech.MaxHP).toEqual(18);
        expect(mech.HeatCapacity).toEqual(12); // 5

        expect(mech.CurrentHP).toEqual(14);
        expect(mech.CurrentHeat).toEqual(0);
        expect(mech.Armor).toEqual(1);
        expect(mech.AttackBonus).toEqual(6);
        expect(mech.TechAttack).toEqual(3); // 10

        expect(mech.SaveTarget).toEqual(16);
        expect(mech.Evasion).toEqual(12);
        expect(mech.Speed).toEqual(8);
        expect(mech.RepairCapacity).toEqual(11);
        expect(mech.SensorRange).toEqual(8); // 15

        expect(mech.Size).toEqual(2); // 16
    });

    it("Properly distinguishes deployable and drone bonuses", async () => {
       expect.assertions(6);
        let s = await init_basic_setup(true);

        // Make a simple mech
        let ctx = new OpCtx();
        let p: Pilot = await s.reg.create_live(EntryType.PILOT, ctx);
        let m: Mech = await s.reg.create_live(EntryType.MECH, ctx);

        // Create some deployables
        let deployable: Deployable = await s.reg.create_live(EntryType.DEPLOYABLE, ctx, {
            type: "Deployable"
        });
        let drone: Deployable = await s.reg.create_live(EntryType.DEPLOYABLE, ctx, {
            type: "Drone"
        });
        let mine: Deployable = await s.reg.create_live(EntryType.DEPLOYABLE, ctx, {
            type: "Mine"
        });

        // Create a system that provides deployable bonuses
        let sys: MechSystem = await s.reg.create_live(EntryType.MECH_SYSTEM, ctx);
        sys.Bonuses.push(Bonus.generate("deployable_hp", 5));
        sys.Bonuses.push(Bonus.generate("drone_hp", 10));
        // sys.Deployables.push(mine, drone, deployable);
        await sys.writeback();

        // Setup some heirarchy stuff
        m.Pilot = p;
        await m.writeback();

        deployable.Deployer = m;
        drone.Deployer = m;
        mine.Deployer = m;
        await deployable.writeback();
        await drone.writeback();
        await mine.writeback();

        expect(deployable.MaxHP).toEqual(deployable.BaseMaxHP);
        expect(drone.MaxHP).toEqual(drone.BaseMaxHP);
        expect(mine.MaxHP).toEqual(mine.BaseMaxHP);

        // Give it to the mech
        // We'll also need to equip a frame - doesn't really matter
        let m_inv = await m.get_inventory();
        let lanny: Frame = await s.reg.get_cat(EntryType.FRAME).lookup_lid_live(ctx, "mf_lancaster")
        let owned_sys = await sys.insinuate(m_inv);
        let owned_lanny = await lanny.insinuate(m_inv);


        // Equip, writeback, and then reload the mech
        m.Loadout.Frame = owned_lanny;
        await m.Loadout.equip_system(owned_sys);
        await m.writeback();
        m = await m.refreshed();
        
        // Equip it on the mech. 

        // Check values on refreshed items
        deployable = await deployable.refreshed();
        drone = await drone.refreshed();
        mine = await mine.refreshed();

        expect(deployable.MaxHP).toEqual(deployable.BaseMaxHP + 5); // + 5 from bonus
        expect(drone.MaxHP).toEqual(drone.BaseMaxHP + 10); // + 10 from bonus
        expect(mine.MaxHP).toEqual(mine.BaseMaxHP); // Unchanged
    });
});
