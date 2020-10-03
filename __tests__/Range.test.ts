import { RangeType } from "../src/class";
import { ident, MixBuilder, RWMix, MixLinks, def, defb, defn, defs, ser_many, def_empty_map } from "@/mixmeta";

//TODO: getRange(mech?: Mech, mount?: Mount) to collect all relevant bonuses

let tv1: any = {
    type: "Range",
    val: 10
}

expect(tv1.type).toBe(RangeType.Range);
expect(tv1.val).toBe(10);