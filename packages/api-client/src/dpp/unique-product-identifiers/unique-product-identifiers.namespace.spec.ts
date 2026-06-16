import { UniqueProductIdentifiersNamespace } from "./unique-product-identifiers.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: [] });
  const post = jest.fn().mockResolvedValue({ data: {} });
  const patch = jest.fn().mockResolvedValue({ data: {} });
  const axiosDelete = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, post, patch, delete: axiosDelete } as any;
  return { ns: new UniqueProductIdentifiersNamespace(axios), axios };
}

describe("UniqueProductIdentifiersNamespace", () => {
  it("list() calls GET /unique-product-identifiers", async () => {
    const { ns, axios } = makeNamespace();
    await ns.list();
    expect(axios.get).toHaveBeenCalledWith("/unique-product-identifiers");
  });

  it("list({limit, cursor}) calls GET /unique-product-identifiers with the pagination params", async () => {
    const { ns, axios } = makeNamespace();
    await ns.list({ limit: 10, cursor: "cursor-token" });
    expect(axios.get).toHaveBeenCalledWith("/unique-product-identifiers", {
      params: { limit: 10, cursor: "cursor-token" },
    });
  });

  it("getByUuid('upi-1') calls GET /unique-product-identifiers/upi-1", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getByUuid("upi-1");
    expect(axios.get).toHaveBeenCalledWith("/unique-product-identifiers/upi-1");
  });

  it("getByUuid('a/b') encodes the segment to /unique-product-identifiers/a%2Fb", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getByUuid("a/b");
    expect(axios.get).toHaveBeenCalledWith("/unique-product-identifiers/a%2Fb");
  });

  it("create() calls POST /unique-product-identifiers with verbatim body", async () => {
    const { ns, axios } = makeNamespace();
    const body = {
      referenceId: "p-1",
      gtin: "04006381333931",
      batch: "LOT-1",
      serial: "SN-1",
    };
    await ns.create(body);
    expect(axios.post).toHaveBeenCalledWith("/unique-product-identifiers", body);
  });

  it("update('upi-1', {gtin, batch:'LOT-2'}) calls PATCH /unique-product-identifiers/upi-1 with verbatim body", async () => {
    const { ns, axios } = makeNamespace();
    const body = { gtin: "04006381333931", batch: "LOT-2" };
    await ns.update("upi-1", body);
    expect(axios.patch).toHaveBeenCalledWith(
      "/unique-product-identifiers/upi-1",
      body,
    );
  });

  it("update('a/b', ...) encodes the segment to /unique-product-identifiers/a%2Fb", async () => {
    const { ns, axios } = makeNamespace();
    await ns.update("a/b", { gtin: "04006381333931", batch: "LOT-2" });
    expect(axios.patch).toHaveBeenCalledWith(
      "/unique-product-identifiers/a%2Fb",
      expect.anything(),
    );
  });

  it("delete('upi-1') calls DELETE /unique-product-identifiers/upi-1", async () => {
    const { ns, axios } = makeNamespace();
    await ns.delete("upi-1");
    expect(axios.delete).toHaveBeenCalledWith(
      "/unique-product-identifiers/upi-1",
    );
  });

  it("delete('a/b') encodes the segment to /unique-product-identifiers/a%2Fb", async () => {
    const { ns, axios } = makeNamespace();
    await ns.delete("a/b");
    expect(axios.delete).toHaveBeenCalledWith(
      "/unique-product-identifiers/a%2Fb",
    );
  });
});
