import { UsersNamespace } from "./users.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const post = jest.fn().mockResolvedValue({ data: {} });
  const patch = jest.fn().mockResolvedValue({ data: {} });
  const axiosDelete = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, post, patch, delete: axiosDelete } as any;
  return { ns: new UsersNamespace(axios), axios };
}

describe("UsersNamespace api keys", () => {
  it("listApiKeys() calls GET /users/me/api-keys", async () => {
    const { ns, axios } = makeNamespace();
    await ns.listApiKeys();
    expect(axios.get).toHaveBeenCalledWith("/users/me/api-keys", { params: undefined });
  });

  it("listApiKeys({limit, cursor}) passes pagination params", async () => {
    const { ns, axios } = makeNamespace();
    await ns.listApiKeys({ limit: 10, cursor: "cursor-token" });
    expect(axios.get).toHaveBeenCalledWith("/users/me/api-keys", {
      params: { limit: 10, cursor: "cursor-token" },
    });
  });

  it("createApiKey() calls POST /users/me/api-keys with verbatim body", async () => {
    const { ns, axios } = makeNamespace();
    await ns.createApiKey({ name: "CI pipeline", expiresInDays: 30 });
    expect(axios.post).toHaveBeenCalledWith("/users/me/api-keys", {
      name: "CI pipeline",
      expiresInDays: 30,
    });
  });

  it("updateApiKey() calls PATCH /users/me/api-keys/:id and encodes the id", async () => {
    const { ns, axios } = makeNamespace();
    await ns.updateApiKey("a/b", { name: "Renamed" });
    expect(axios.patch).toHaveBeenCalledWith("/users/me/api-keys/a%2Fb", { name: "Renamed" });
  });

  it("deleteApiKey() calls DELETE /users/me/api-keys/:id", async () => {
    const { ns, axios } = makeNamespace();
    await ns.deleteApiKey("key-1");
    expect(axios.delete).toHaveBeenCalledWith("/users/me/api-keys/key-1");
  });
});
