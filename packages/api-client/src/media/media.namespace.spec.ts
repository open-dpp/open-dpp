import { MediaNamespace } from "./media.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const post = jest.fn().mockResolvedValue({ status: 201, data: { mediaId: "m-1" } });
  const axios = { get, post } as any;
  return { ns: new MediaNamespace(axios), axios };
}

describe("MediaNamespace — ADR 0006 (Design C) permalink-gated by-id routes", () => {
  it("getPermalinkMediaInfo → GET /media/permalink/{idOrSlug}/by-id/{mediaId}/info", async () => {
    const { ns, axios } = makeNamespace();
    await ns.getPermalinkMediaInfo("slug-1", "m-1");
    expect(axios.get).toHaveBeenCalledWith("/media/permalink/slug-1/by-id/m-1/info");
  });

  it("downloadPermalinkMedia → GET /media/permalink/{idOrSlug}/by-id/{mediaId}/download", async () => {
    const { ns, axios } = makeNamespace();
    await ns.downloadPermalinkMedia("slug-1", "m-1");
    expect(axios.get).toHaveBeenCalledWith("/media/permalink/slug-1/by-id/m-1/download", {
      responseType: "blob",
    });
  });
});
