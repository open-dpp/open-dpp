import { PolicyKeyList } from "@open-dpp/dto";
import { PoliciesNamespace } from "./policies.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const patch = jest.fn().mockResolvedValue({ data: {} });
  const axios = { get, patch } as any;
  return { ns: new PoliciesNamespace(axios), axios };
}

describe("PoliciesNamespace", () => {
  it("get() calls GET /policies", async () => {
    const { ns, axios } = makeNamespace();
    await ns.get("org-1");
    expect(axios.get).toHaveBeenCalledWith("/policies/organizations/org-1");
  });

  it("setLimits() calls PATCH /policies/organizations/:organizationId/limits with verbatim body", async () => {
    const { ns, axios } = makeNamespace();
    const limits = { [PolicyKeyList.AI_TOKEN_QUOTA]: 1000 };

    await ns.setLimits("org-1", limits);

    expect(axios.patch).toHaveBeenCalledWith("/policies/organizations/org-1/limits", limits);
  });

  it("setLimits() passes through every given policy key", async () => {
    const { ns, axios } = makeNamespace();
    const limits = {
      [PolicyKeyList.AI_TOKEN_QUOTA]: 1000,
      [PolicyKeyList.MEDIA_STORAGE_LIMIT]: 500,
    };

    await ns.setLimits("org-2", limits);

    expect(axios.patch).toHaveBeenCalledWith("/policies/organizations/org-2/limits", limits);
  });
});
