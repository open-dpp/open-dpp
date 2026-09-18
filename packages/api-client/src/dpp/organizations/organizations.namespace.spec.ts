import { OrganizationsNamespace } from "./organizations.namespace";

function makeNamespace() {
  const post = jest.fn().mockResolvedValue({ data: {} });
  const axios = { post } as any;
  return { ns: new OrganizationsNamespace(axios), axios };
}

describe("OrganizationsNamespace", () => {
  it("post() calls POST /organizations with the name only", async () => {
    const { ns, axios } = makeNamespace();
    await ns.post({ name: "ACME GmbH" });
    expect(axios.post).toHaveBeenCalledWith("/organizations", { name: "ACME GmbH" });
  });

  it("post() passes the owner through verbatim", async () => {
    const { ns, axios } = makeNamespace();
    const body = {
      name: "ACME GmbH",
      owner: {
        email: "jane@example.com",
        firstName: "Jane",
        lastName: "Doe",
        locale: "de" as const,
      },
    };
    await ns.post(body);
    expect(axios.post).toHaveBeenCalledWith("/organizations", body);
  });
});
