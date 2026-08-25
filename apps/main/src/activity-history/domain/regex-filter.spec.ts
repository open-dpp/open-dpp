import { RegexFilter } from "./regex-filter";

describe("RegexFilter", () => {
  it("should test starts with (sw)", () => {
    const filter = RegexFilter.create("sw:list");
    expect(filter.test("list")).toBeTruthy();
    expect(filter.test("list.prop1")).toBeTruthy();
    expect(filter.test("lis1")).toBeFalsy();

    expect(filter.toMongoFilter()).toEqual({
      $regex: "^list",
      $options: "i",
    });
  });

  it("should test starts with (eq)", () => {
    let filter = RegexFilter.create("list");
    expect(filter.test("list")).toBeTruthy();
    expect(filter.test("list.prop1")).toBeFalsy();

    filter = RegexFilter.create("eq:list");
    expect(filter.test("list")).toBeTruthy();
    expect(filter.test("list.prop1")).toBeFalsy();

    expect(filter.toMongoFilter()).toEqual("list");
  });
});
