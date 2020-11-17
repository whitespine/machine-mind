export * from "@src/interface";
export * from "@src/class";

// Group these for clarity
export * as enums from "@src/enums";
export * as funcs from "@src/funcs";
export * as typed_lancer_data from "@src/classes/utility/typed_lancerdata";


// Bundle these for clarity
import * as r1 from "@src/registry";
import * as r2 from "@src/classes/regstack";
import * as r3 from "@src/static_registry";
export const registry = {...r1, ...r2, ...r3};
