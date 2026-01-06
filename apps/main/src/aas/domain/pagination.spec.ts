import { decodeCursor, encodeCursor, Pagination } from "./pagination";

describe("pagination", () => {
  const pages = ["1", "2", "3", "4"];
  it("should evaluate next pages correctly", () => {
    const pagination = Pagination.create({ cursor: "1", limit: 3 });
    expect(pagination.nextPages(pages)).toEqual(["2", "3", "4"]);
    expect(pagination.cursor).toEqual("4");
  });

  it("should evaluate next pages where cursor undefined", () => {
    const pagination = Pagination.create({ limit: 3 });
    expect(pagination.nextPages(pages)).toEqual(["1", "2", "3"]);
    expect(pagination.cursor).toEqual("3");
  });

  it("should evaluate next pages where limit undefined", () => {
    const pagination = Pagination.create({ cursor: "2" });
    expect(pagination.nextPages(pages)).toEqual(["3", "4"]);
    expect(pagination.cursor).toEqual("4");
  });

  it("should evaluate next pages where cursor and limit undefined", () => {
    const pagination = Pagination.create({ });
    expect(pagination.nextPages(pages)).toEqual(["1", "2", "3", "4"]);
    expect(pagination.cursor).toEqual("4");
  });

  it("should evaluate next pages where limit greater than provide pages length", () => {
    const pagination = Pagination.create({ cursor: "2", limit: 7 });
    expect(pagination.nextPages(pages)).toEqual(["3", "4"]);
    expect(pagination.cursor).toEqual("4");
  });

  it("should encode and decode cursor by using createdAt and id", () => {
    const createdAt = "2022-01-03T00:00:00.000Z";
    const uuid = "123e4567-e89b-12d3-a456-426655440000";
    const encodedCursor = encodeCursor(createdAt, uuid);
    const decodedCursor = decodeCursor(encodedCursor);
    expect(decodedCursor).toEqual({ createdAt, id: uuid });
  });
});
