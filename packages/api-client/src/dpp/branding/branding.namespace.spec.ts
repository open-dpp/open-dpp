import { BrandingNamespace } from "./branding.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: new Blob() });
  const put = jest.fn().mockResolvedValue({ data: {} });
  const axios = { get, put } as any;
  return { ns: new BrandingNamespace(axios), axios };
}

describe("BrandingNamespace", () => {
  it("downloadLogo → GET /branding/logo/{mediaId} as a blob", async () => {
    const { ns, axios } = makeNamespace();
    await ns.downloadLogo("m-1");
    expect(axios.get).toHaveBeenCalledWith("/branding/logo/m-1", { responseType: "blob" });
  });

  it("encodes the mediaId path segment", async () => {
    const { ns, axios } = makeNamespace();
    await ns.downloadLogo("a/b");
    expect(axios.get).toHaveBeenCalledWith("/branding/logo/a%2Fb", { responseType: "blob" });
  });
});
