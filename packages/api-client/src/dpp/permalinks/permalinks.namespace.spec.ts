import {
  permalinkCreateRequestPlainFactory,
  permalinkGs1LinkCreateRequestPlainFactory,
  permalinkUpdateRequestPlainFactory,
} from "@open-dpp/testing";
import { PermalinksNamespace } from "./permalinks.namespace";

function makeNamespace() {
  const get = jest.fn().mockResolvedValue({ data: {} });
  const post = jest.fn().mockResolvedValue({ data: {} });
  const patch = jest.fn().mockResolvedValue({ data: {} });
  const axiosDelete = jest.fn().mockResolvedValue({ data: undefined });
  const axios = { get, post, patch, delete: axiosDelete } as any;
  return { ns: new PermalinksNamespace(axios), axios };
}

describe("PermalinksNamespace", () => {
  describe("backoffice methods", () => {
    it("list() calls GET /permalinks", async () => {
      const { ns, axios } = makeNamespace();
      await ns.list();
      expect(axios.get).toHaveBeenCalledWith("/permalinks", { params: undefined });
    });

    it("list({limit, cursor}) calls GET /permalinks with the pagination params", async () => {
      const { ns, axios } = makeNamespace();
      await ns.list({ limit: 10, cursor: "cursor-token" });
      expect(axios.get).toHaveBeenCalledWith("/permalinks", {
        params: { limit: 10, cursor: "cursor-token" },
      });
    });

    it("create() with gs1-link body calls POST /permalinks with verbatim body", async () => {
      const { ns, axios } = makeNamespace();
      const body = permalinkGs1LinkCreateRequestPlainFactory.build();
      await ns.create(body);
      expect(axios.post).toHaveBeenCalledWith("/permalinks", body);
    });

    it("create() with presentation body calls POST /permalinks with verbatim body", async () => {
      const { ns, axios } = makeNamespace();
      const body = permalinkCreateRequestPlainFactory.build({
        presentationConfigurationId: "config-1",
        slug: "my-slug",
      });
      await ns.create(body);
      expect(axios.post).toHaveBeenCalledWith("/permalinks", body);
    });

    it("updateById('pl-1', {slug:'s', baseUrl:null}) calls PATCH /permalinks/pl-1 with verbatim body", async () => {
      const { ns, axios } = makeNamespace();
      const body = permalinkUpdateRequestPlainFactory.build({ slug: "my-slug", baseUrl: null });
      await ns.updateById("pl-1", body);
      expect(axios.patch).toHaveBeenCalledWith("/permalinks/pl-1", body);
    });

    it("updateById encodes the id in the URL", async () => {
      const { ns, axios } = makeNamespace();
      await ns.updateById("a/b", { slug: "my-slug" as any });
      expect(axios.patch).toHaveBeenCalledWith("/permalinks/a%2Fb", expect.anything());
    });

    it("delete('pl-1') calls DELETE /permalinks/pl-1", async () => {
      const { ns, axios } = makeNamespace();
      await ns.delete("pl-1");
      expect(axios.delete).toHaveBeenCalledWith("/permalinks/pl-1");
    });

    it("delete encodes the id in the URL", async () => {
      const { ns, axios } = makeNamespace();
      await ns.delete("a/b");
      expect(axios.delete).toHaveBeenCalledWith("/permalinks/a%2Fb");
    });

    it("setPrimary('pl-1') calls POST /permalinks/pl-1/primary with no body", async () => {
      const { ns, axios } = makeNamespace();
      await ns.setPrimary("pl-1");
      expect(axios.post).toHaveBeenCalledWith("/permalinks/pl-1/primary");
    });

    it("setPrimary encodes the id in the URL", async () => {
      const { ns, axios } = makeNamespace();
      await ns.setPrimary("a/b");
      expect(axios.post).toHaveBeenCalledWith("/permalinks/a%2Fb/primary");
    });
  });

  describe("public resolver methods (regression)", () => {
    it("getByPassport('p-1') still calls GET /p?passportId=p-1", async () => {
      const { ns, axios } = makeNamespace();
      await ns.getByPassport("p-1");
      expect(axios.get).toHaveBeenCalledWith("/p?passportId=p-1");
    });

    it("getById('slug') still calls GET /p/slug", async () => {
      const { ns, axios } = makeNamespace();
      await ns.getById("slug");
      expect(axios.get).toHaveBeenCalledWith("/p/slug");
    });

    it("updateByResolver('pl-1', body) calls PATCH /p/pl-1 with verbatim body", async () => {
      const { ns, axios } = makeNamespace();
      const body = permalinkUpdateRequestPlainFactory.build({ slug: "my-slug", baseUrl: null });
      await ns.updateByResolver("pl-1", body);
      expect(axios.patch).toHaveBeenCalledWith("/p/pl-1", body);
    });
  });
});
