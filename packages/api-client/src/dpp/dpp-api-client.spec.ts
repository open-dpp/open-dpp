import { DppApiClient } from "./dpp-api-client";
import { UniqueProductIdentifiersNamespace } from "./unique-product-identifiers/unique-product-identifiers.namespace";
import { PermalinksNamespace } from "./permalinks/permalinks.namespace";

// Pin re-exports from the package index — these must resolve for the spec to import cleanly.
import {
  UniqueProductIdentifiersNamespace as UpiNsFromIndex,
  PermalinksNamespace as PermalinksNsFromIndex,
} from "../index";

// Import UPI DTO types + new permalink request types from the package index.
// These compile-time pins verify the index re-exports resolve under tsc --noEmit.
import type {
  UniqueProductIdentifierListDto,
  UniqueProductIdentifierListItemDto,
  CreateGs1UniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
  PermalinkCreateRequest,
  PermalinkUpdateRequest,
} from "../index";

// Use a declare const to satisfy tsc: the named types must resolve (compile-time
// only — declare const has no runtime footprint).
declare const _typePin: [
  UniqueProductIdentifierListDto,
  UniqueProductIdentifierListItemDto,
  CreateGs1UniqueProductIdentifierRequest,
  UpdateGs1UniqueProductIdentifierRequest,
  PermalinkCreateRequest,
  PermalinkUpdateRequest,
];

describe("DppApiClient", () => {
  describe("namespace registration", () => {
    it("client.uniqueProductIdentifiers is an instance of UniqueProductIdentifiersNamespace", () => {
      const client = new DppApiClient({});
      expect(client.uniqueProductIdentifiers).toBeInstanceOf(
        UniqueProductIdentifiersNamespace,
      );
    });

    it("client.permalinks is an instance of PermalinksNamespace", () => {
      const client = new DppApiClient({});
      expect(client.permalinks).toBeInstanceOf(PermalinksNamespace);
    });

    it("setActiveOrganizationId re-creates namespaces correctly", () => {
      const client = new DppApiClient({});
      client.setActiveOrganizationId("org-1");
      expect(client.uniqueProductIdentifiers).toBeInstanceOf(
        UniqueProductIdentifiersNamespace,
      );
      expect(client.permalinks).toBeInstanceOf(PermalinksNamespace);
    });
  });

  describe("index re-exports", () => {
    it("UniqueProductIdentifiersNamespace is re-exported from the package index", () => {
      // If the import above failed, this test wouldn't even run.
      expect(UpiNsFromIndex).toBeDefined();
      expect(UpiNsFromIndex).toBe(UniqueProductIdentifiersNamespace);
    });

    it("PermalinksNamespace is re-exported from the package index", () => {
      expect(PermalinksNsFromIndex).toBeDefined();
      expect(PermalinksNsFromIndex).toBe(PermalinksNamespace);
    });
  });
});
