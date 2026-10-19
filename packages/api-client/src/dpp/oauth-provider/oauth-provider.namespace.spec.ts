import { OAuthProviderNamespace } from "./oauth-provider.namespace";

function makeNamespace() {
  const post = jest.fn().mockResolvedValue({ data: { url: "https://landing.example.com/cb" } });
  const axios = { post } as any;
  return { ns: new OAuthProviderNamespace(axios), axios };
}

describe("OAuthProviderNamespace", () => {
  it("continueAuthorization() calls POST /oauth-provider/continue with the signed query", async () => {
    const { ns, axios } = makeNamespace();

    const response = await ns.continueAuthorization({ oauthQuery: "prompt=create&sig=abc" });

    expect(axios.post).toHaveBeenCalledWith("/oauth-provider/continue", {
      oauthQuery: "prompt=create&sig=abc",
    });
    expect(response.data).toEqual({ url: "https://landing.example.com/cb" });
  });
});
