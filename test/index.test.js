const { foo } = require("../src");

describe("the world", () => {
  it("says hello", () => {
    expect(foo()).toBe('hello');
  });
});
