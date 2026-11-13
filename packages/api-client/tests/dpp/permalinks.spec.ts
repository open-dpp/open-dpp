import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { CARRIER_EXPORT_CONTENT_TYPES } from "@open-dpp/dto";
import { OpenDppClient } from "../../src";
import { DEFAULT_API_URL } from "../../src/urls";
import { activeOrganization } from "./handlers/organization";
import { paginationParams } from "./handlers/pagination";
import {
  carrierExportSettings,
  gs1LinkCreateRequest,
  openDppCreateRequest,
  permalink1,
  permalink2,
  permalinkBundle,
  permalinkIdWithSlash,
  permalinkUpdateRequest,
  updatedPermalink,
} from "./handlers/permalinks";
import { server } from "./msw.server";

describe("permalinks", () => {
  // DEFAULT_API_URL is the hosted instance: a request no handler matches must fail, not go out.
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const sdk = new OpenDppClient({
    dpp: { baseURL: DEFAULT_API_URL },
  });
  sdk.setActiveOrganizationId(activeOrganization.id);

  describe("backoffice methods", () => {
    it("should list the first page of permalinks", async () => {
      const response = await sdk.dpp.permalinks.list();
      expect(response.data.result).toEqual([permalink1]);
      expect(response.data.paging_metadata.cursor).toEqual(permalink1.id);
    });

    it("should list the next page of permalinks with pagination params", async () => {
      const response = await sdk.dpp.permalinks.list(paginationParams);
      expect(response.data.result).toEqual([permalink2]);
      expect(response.data.paging_metadata.cursor).toBeNull();
    });

    it("should create an open-dpp permalink with the body unchanged", async () => {
      const response = await sdk.dpp.permalinks.create(openDppCreateRequest);
      expect(response.status).toEqual(201);
      expect(response.data).toEqual(permalink1);
    });

    it("should create a gs1-link permalink with the body unchanged", async () => {
      const response = await sdk.dpp.permalinks.create(gs1LinkCreateRequest);
      expect(response.status).toEqual(201);
      expect(response.data).toEqual(permalink2);
    });

    it("should update a permalink with the body unchanged", async () => {
      const response = await sdk.dpp.permalinks.updateById(permalink1.id, permalinkUpdateRequest);
      expect(response.data).toEqual(updatedPermalink);
    });

    it("should encode the id when updating a permalink", async () => {
      const response = await sdk.dpp.permalinks.updateById(
        permalinkIdWithSlash,
        permalinkUpdateRequest,
      );
      expect(response.data).toEqual(updatedPermalink);
    });

    it("should delete a permalink", async () => {
      const response = await sdk.dpp.permalinks.delete(permalink1.id);
      expect(response.status).toEqual(204);
    });

    it("should encode the id when deleting a permalink", async () => {
      const response = await sdk.dpp.permalinks.delete(permalinkIdWithSlash);
      expect(response.status).toEqual(204);
    });

    it("should get the carrier export as blob with the default settings", async () => {
      const response = await sdk.dpp.permalinks.getCarrierExport(permalink1.id);
      expect(response.status).toEqual(200);
      expect(response.config.responseType).toEqual("blob");
      expect(response.headers["content-type"]).toEqual(CARRIER_EXPORT_CONTENT_TYPES.svg);
    });

    it("should get the carrier export with the settings as query params and the id encoded", async () => {
      const response = await sdk.dpp.permalinks.getCarrierExport(
        permalinkIdWithSlash,
        carrierExportSettings,
      );
      expect(response.status).toEqual(200);
      expect(response.config.responseType).toEqual("blob");
      expect(response.headers["content-type"]).toEqual(CARRIER_EXPORT_CONTENT_TYPES.png);
    });

    it("should no longer expose setPrimary (primary concept removed)", () => {
      expect("setPrimary" in sdk.dpp.permalinks).toBe(false);
    });
  });

  describe("public resolver methods", () => {
    it("should get the permalinks of a passport", async () => {
      const response = await sdk.dpp.permalinks.getByPassport(permalink1.passportId);
      expect(response.data).toEqual([permalink1]);
    });

    it("should get the passport bundle of a permalink", async () => {
      const response = await sdk.dpp.permalinks.getById(permalink1.id);
      expect(response.data).toEqual(permalinkBundle);
    });

    it("should update a permalink through the resolver with the body unchanged", async () => {
      const response = await sdk.dpp.permalinks.updateByResolver(
        permalink1.id,
        permalinkUpdateRequest,
      );
      expect(response.data).toEqual(updatedPermalink);
    });
  });
});
