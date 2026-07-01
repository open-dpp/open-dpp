/**
 * PassportNamespace surface guards.
 *
 * The 1:1 GS1 write surface and the canonical `getUniqueProductIdentifierOfPassport`
 * lookup (ADR 0006) are removed — the @ts-expect-error guards below assert the members
 * no longer exist (before removal they fail as unused directives).
 */

import { PassportNamespace } from "./passports.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const put = jest.fn().mockResolvedValue({ data: {} });
  const axiosDelete = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, put, delete: axiosDelete } as any;
  return { ns: new PassportNamespace(axios), axios };
}

describe("PassportNamespace — removed surface", () => {
  it("getUniqueProductIdentifierOfPassport does NOT exist (ADR 0006)", () => {
    const { ns } = makeNamespace();
    // @ts-expect-error — method must not exist after removal
    expect(ns.getUniqueProductIdentifierOfPassport).toBeUndefined();
  });

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
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/permalinks", { params: undefined });
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
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/unique-product-identifiers", {
      params: undefined,
    });
  });

  it("getUniqueProductIdentifiers('p-1', {limit, cursor}) passes the pagination params", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getUniqueProductIdentifiers("p-1", { limit: 5, cursor: "x" });
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/unique-product-identifiers", {
      params: { limit: 5, cursor: "x" },
    });
  });
});
