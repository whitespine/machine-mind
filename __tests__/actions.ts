
// @ts-nocheck
import "jest";
import { Action, ActivationType, BaseActionsMap } from "../src";


describe("Actions", () => {
    it("Doesn't do weird circular import problems", () => {
        let a = new Action({name: "bean boy"});
        expect(a).toBeTruthy();
    });

    it("Loads a simple base action successfully", () => {
        const boost = BaseActionsMap.get("act_boost");
        expect(boost.Name).toEqual("BOOST");
        expect(boost.Activation).toEqual(ActivationType.Quick);
        expect(boost.AvailableMounted).toBeTruthy();
        expect(boost.AvailableUnmounted).toBeTruthy();
    });
});
