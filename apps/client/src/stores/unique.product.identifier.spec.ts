import type {
  UniqueProductIdentifierReferenceDto,
} from "@open-dpp/api-client";
import {
  GranularityLevel,
} from "@open-dpp/api-client";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import apiClient from "../lib/api-client";
import { useUniqueProductIdentifierStore } from "./unique.product.identifier";

const mocks = vi.hoisted(() => {
  return {
    getReference: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      uniqueProductIdentifiers: {
        getReference: mocks.getReference,
      },
    },
  },
}));

describe("uniqueProductIdentifierStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should build link for item reference", async () => {
    const uniqueProductIdentifierStore = useUniqueProductIdentifierStore();

    const mockedUniqueProductIdentifierReference: UniqueProductIdentifierReferenceDto
      = {
        id: "refId",
        organizationId: "orgaId",
        modelId: "modelId",
        granularityLevel: GranularityLevel.ITEM,
      };

    mocks.getReference.mockResolvedValue({
      data: mockedUniqueProductIdentifierReference,
    });
    const result
      = await uniqueProductIdentifierStore.buildLinkToReferencedProduct("uuid");
    await waitFor(() =>
      expect(
        apiClient.dpp.uniqueProductIdentifiers.getReference,
      ).toHaveBeenCalledWith("uuid"),
    );
    expect(result).toEqual(`/organizations/orgaId/models/modelId/items/refId`);
  });

  it("should build link for model reference", async () => {
    const uniqueProductIdentifierStore = useUniqueProductIdentifierStore();

    const mockedUniqueProductIdentifierReference: UniqueProductIdentifierReferenceDto
      = {
        id: "refId",
        organizationId: "orgaId",
        granularityLevel: GranularityLevel.MODEL,
      };

    mocks.getReference.mockResolvedValue({
      data: mockedUniqueProductIdentifierReference,
    });
    const result
      = await uniqueProductIdentifierStore.buildLinkToReferencedProduct("uuid");
    await waitFor(() =>
      expect(
        apiClient.dpp.uniqueProductIdentifiers.getReference,
      ).toHaveBeenCalledWith("uuid"),
    );
    expect(result).toEqual(`/organizations/orgaId/models/refId`);
  });
});
