const { Blueprint } = require("../src");

describe("Blueprint", () => {
    it("provides object", () => {
        const blueprint = new Blueprint();

        expect(typeof blueprint.make()).toBe("object");
    });
});
