import { submodelDesignOfProductPlainResponseFactory } from "@open-dpp/testing";
import { expect, it, vi } from "vitest";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasEditor } from "./aas-editor.ts";

const mocks = vi.hoisted(() => {
  return {
    createSubmodel: vi.fn(),
    getSubmodels: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        aas: {
          createSubmodel: mocks.createSubmodel,
          getSubmodels: mocks.getSubmodels,
        },
      },
    },
  },
}));

describe("aasEditor composable", () => {
  const aasId = "1";
  it("should get submodels", async () => {
    const submodel = submodelDesignOfProductPlainResponseFactory.build();
    const response = { paging_metadata: { cursor: null }, result: [submodel] };
    mocks.getSubmodels.mockResolvedValue({
      data: response,
    });
    const { nextPage, submodels } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
    });
    await nextPage();
    expect(mocks.getSubmodels).toHaveBeenCalledWith(aasId, {
      cursor: undefined,
      limit: 10,
    });
    expect(submodels.value).toEqual(response);
  });

  it("should create submodel", async () => {
    const submodel = submodelDesignOfProductPlainResponseFactory.build();
    const paginationResponse = {
      paging_metadata: { cursor: null },
      result: [submodel],
    };
    mocks.createSubmodel.mockResolvedValue({
      data: submodel,
      status: HTTPCode.CREATED,
    });
    mocks.getSubmodels.mockResolvedValue({ data: paginationResponse });

    const { createSubmodel, submodels } = useAasEditor({
      id: aasId,
      aasNamespace: apiClient.dpp.templates.aas,
    });
    await createSubmodel();
    expect(mocks.createSubmodel).toHaveBeenCalledWith(aasId, {
      idShort: expect.any(String),
    });
    expect(mocks.getSubmodels).toHaveBeenCalledWith(aasId, {
      cursor: undefined,
      limit: 10,
    });
    expect(submodels.value).toEqual(paginationResponse);
  });
});
