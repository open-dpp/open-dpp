import { PresentationConfigurationNamespace } from "./presentation-configuration.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: [] });
  const post = jest.fn().mockResolvedValue({ data: {} });
  const patch = jest.fn().mockResolvedValue({ data: {} });
  const del = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, post, patch, delete: del } as any;
  return { ns: new PresentationConfigurationNamespace(axios, "passports"), axios };
}

describe("PresentationConfigurationNamespace plural", () => {
  it("list calls plural URL", async () => {
    const { ns, axios } = makeNamespace();
    await ns.list("p-1");
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/presentation-configurations");
  });

  it("create calls POST plural URL with body", async () => {
    const { ns, axios } = makeNamespace();
    await ns.create("p-1", { label: "v1" });
    expect(axios.post).toHaveBeenCalledWith(
      "/passports/p-1/presentation-configurations",
      { label: "v1" },
    );
  });

  it("getById calls GET config-scoped URL", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getById("p-1", "c-1");
    expect(axios.get).toHaveBeenCalledWith(
      "/passports/p-1/presentation-configurations/c-1",
    );
  });

  it("patchById calls PATCH config-scoped URL", async () => {
    const { ns, axios } = makeNamespace();
    await ns.patchById("p-1", "c-1", { elementDesign: { foo: "BigNumber" } });
    expect(axios.patch).toHaveBeenCalledWith(
      "/passports/p-1/presentation-configurations/c-1",
      { elementDesign: { foo: "BigNumber" } },
    );
  });

  it("deleteById calls DELETE config-scoped URL", async () => {
    const { ns, axios } = makeNamespace();
    await ns.deleteById("p-1", "c-1");
    expect(axios.delete).toHaveBeenCalledWith(
      "/passports/p-1/presentation-configurations/c-1",
    );
  });

  it("get (singular) keeps existing URL", async () => {
    const { ns, axios } = makeNamespace();
    await ns.get("p-1");
    expect(axios.get).toHaveBeenCalledWith("/passports/p-1/presentation-configuration");
  });

  it("templates scope uses /templates path", async () => {
    const get = jest.fn().mockResolvedValue({ data: [] });
    const ns = new PresentationConfigurationNamespace({ get } as any, "templates");
    await ns.list("t-1");
    expect(get).toHaveBeenCalledWith("/templates/t-1/presentation-configurations");
  });
});
