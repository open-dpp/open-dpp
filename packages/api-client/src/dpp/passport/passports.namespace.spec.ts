/**
 * Slice 56 — PassportNamespace: verify 1:1 GS1 write surface removed.
 *
 * Test (A): getUniqueProductIdentifierOfPassport still delegates to
 *           GET /passports/:id/unique-product-identifier.
 *
 * Tests (B): TypeScript-level removal guards — @ts-expect-error directives on
 *            the three removed methods must pass (i.e. the members must NOT
 *            exist); before removal they fail (unused-directive error).
 */

import { PassportNamespace } from "./passports.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const put = jest.fn().mockResolvedValue({ data: {} });
  const axiosDelete = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, put, delete: axiosDelete } as any;
  return { ns: new PassportNamespace(axios), axios };
}

describe("PassportNamespace — remaining surface", () => {
  it("getUniqueProductIdentifierOfPassport('p-1') calls GET /passports/p-1/unique-product-identifier", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getUniqueProductIdentifierOfPassport("p-1");
    expect(axios.get).toHaveBeenCalledWith(
      "/passports/p-1/unique-product-identifier",
    );
  });
});

describe("PassportNamespace — removed 1:1 GS1 write surface", () => {
  it("getGs1Identity does NOT exist on PassportNamespace", () => {
    const { ns } = makeNamespace();
    // @ts-expect-error — method must not exist after removal
    expect(ns.getGs1Identity).toBeUndefined();
  });

  it("setGs1Identity does NOT exist on PassportNamespace", () => {
    const { ns } = makeNamespace();
    // @ts-expect-error — method must not exist after removal
    expect(ns.setGs1Identity).toBeUndefined();
  });

  it("deleteGs1Identity does NOT exist on PassportNamespace", () => {
    const { ns } = makeNamespace();
    // @ts-expect-error — method must not exist after removal
    expect(ns.deleteGs1Identity).toBeUndefined();
  });
});

describe("PassportNamespace — passport-scoped lists", () => {
  it("getPermalinks('p-1') calls GET /passports/p-1/permalinks", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getPermalinks("p-1");
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/permalinks");
  });

  it("getPermalinks('p-1', {limit, cursor}) passes the pagination params", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getPermalinks("p-1", { limit: 10, cursor: "cursor-token" });
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/permalinks", {
      params: { limit: 10, cursor: "cursor-token" },
    });
  });

  it("getUniqueProductIdentifiers('p-1') calls GET /passports/p-1/unique-product-identifiers", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getUniqueProductIdentifiers("p-1");
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/unique-product-identifiers");
  });

  it("getUniqueProductIdentifiers('p-1', {limit, cursor}) passes the pagination params", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getUniqueProductIdentifiers("p-1", { limit: 5, cursor: "x" });
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/unique-product-identifiers", {
      params: { limit: 5, cursor: "x" },
    });
  });
});
