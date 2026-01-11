import type { SubmodelResponseDto } from "@open-dpp/dto";
import { KeyTypes } from "@open-dpp/dto";
import { submodelDesignOfProductPlainFactory, submodelPlainToResponse } from "@open-dpp/testing";
import { omit } from "lodash";
import { v4 as uuid4 } from "uuid";
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
  const iriDomain = `https://open-dpp.de/${uuid4()}`;
  it("should get submodels", async () => {
    const submodel: SubmodelResponseDto = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
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
    expect(submodels.value).toEqual([
      {
        key: `${submodel.id}`,
        data: {
          idShort: submodel.idShort,
          modelType: KeyTypes.Submodel,
          plain: omit(submodel, "submodelElements"),
          path: { submodelId: submodel.id },
        },
        children: [
          {
            key: `${submodel.idShort}.Design_V01`,
            data: {
              idShort: "Design_V01",
              modelType: "SubmodelElementCollection",
              path: { submodelId: submodel.id, idShortPath: `${submodel.idShort}.Design_V01` },
              plain: submodel.submodelElements[0],
            },
          },
        ],
      },
    ]);
  });

  it("should create submodel", async () => {
    const submodel: SubmodelResponseDto = submodelPlainToResponse(
      submodelDesignOfProductPlainFactory.build(undefined, { transient: { iriDomain } }),
    );
    const paginationResponse = {
      paging_metadata: { cursor: null },
      result: [submodel],
    };
    mocks.createSubmodel.mockResolvedValue({
      data: submodel,
      status: HTTPCode.CREATED,
    });
    mocks.getSubmodels.mockResolvedValue({ data: paginationResponse });

    const { createSubmodel, drawerVisible } = useAasEditor({
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
    expect(drawerVisible.value).toBe(false);
  });
});
