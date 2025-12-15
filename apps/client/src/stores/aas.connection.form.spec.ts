import type {
  AasConnectionDto,
  AasFieldAssignmentDto,
  AasPropertyWithParentDto,
  ModelDto,
  TemplateDto,
} from "@open-dpp/api-client";
import {
  AssetAdministrationShellType,
  DataFieldType,
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";
import { waitFor } from "@testing-library/vue";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import apiClient from "../lib/api-client";
import { useAasConnectionFormStore } from "./aas.connection.form";

const mocks = vi.hoisted(() => {
  return {
    getTemplateById: vi.fn(),
    getConnection: vi.fn(),
    getPropertiesOfAas: vi.fn(),
    modifyConnection: vi.fn(),
    getModelById: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      aasIntegration: {
        getConnection: mocks.getConnection,
        getPropertiesOfAas: mocks.getPropertiesOfAas,
        modifyConnection: mocks.modifyConnection,
      },
      models: {
        getById: mocks.getModelById,
      },
      templates: {
        getById: mocks.getTemplateById,
      },
    },
  },
}));

describe("integrationFormStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  const connectionId = "aasMappingId";

  const aasConnection: AasConnectionDto = {
    id: connectionId,
    name: "Connection 1",
    modelId: "modelId",
    aasType: AssetAdministrationShellType.Truck,
    dataModelId: "dataModelId",
    fieldAssignments: [
      {
        dataFieldId: "f1",
        sectionId: "s1",
        idShortParent: "p1",
        idShort: "i1",
      },
      {
        dataFieldId: "f2",
        sectionId: "s2",
        idShortParent: "p2",
        idShort: "i2",
      },
    ],
  };

  const mockedProperties: AasPropertyWithParentDto[] = [
    {
      parentIdShort: "p1",
      property: {
        idShort: "i1",
        valueType: "xs:string",
        modelType: "Property",
      },
    },
    {
      parentIdShort: "p2",
      property: {
        idShort: "i2",
        valueType: "xs:string",
        modelType: "Property",
      },
    },
  ];

  const templateDto: TemplateDto = {
    id: "dataModelId",
    name: "Test Product Data Model",
    version: "1.0.0",
    createdByUserId: "userId",
    ownedByOrganizationId: "orgaId",
    sections: [
      {
        id: "s0",
        name: "Section 0",
        type: SectionType.GROUP,
        subSections: ["s2"],
        dataFields: [
          {
            id: "f0",
            name: "Field 0",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        id: "s1",
        name: "Section 1",
        type: SectionType.GROUP,
        subSections: [],
        dataFields: [
          {
            id: "f1",
            name: "Field 1",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        id: "s2",
        parentId: "s0",
        name: "Section 2",
        type: SectionType.GROUP,
        subSections: [],
        dataFields: [
          {
            id: "f2",
            name: "Field 2",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
          {
            id: "f3",
            name: "Field 3",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
          {
            id: "f4",
            name: "Field 4",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.MODEL,
          },
        ],
      },
    ],
  };

  const otherTemplateDto: TemplateDto = {
    id: "other-dataModelId",
    name: "Other Test Product Data Model",
    version: "1.0.0",
    createdByUserId: "userId",
    ownedByOrganizationId: "orgaId",
    sections: [
      {
        id: "s0",
        name: "Section 0",
        type: SectionType.GROUP,
        subSections: ["s2"],
        dataFields: [
          {
            id: "f0",
            name: "Field 0",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        id: "s1",
        name: "Section 1",
        type: SectionType.GROUP,
        subSections: [],
        dataFields: [
          {
            id: "f1-other",
            name: "Field 1 other",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
        ],
      },
      {
        id: "s2",
        parentId: "s0",
        name: "Section 2",
        type: SectionType.GROUP,
        subSections: [],
        dataFields: [
          {
            id: "f2",
            name: "Field 2",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
          {
            id: "f3-other",
            name: "Field 3 other",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.ITEM,
          },
          {
            id: "f4",
            name: "Field 4",
            type: DataFieldType.TEXT_FIELD,
            granularityLevel: GranularityLevel.MODEL,
          },
        ],
      },
    ],
  };

  it("should initialize fieldAssignments correctly", async () => {
    const integrationFormStore = useAasConnectionFormStore();

    mocks.getTemplateById.mockResolvedValue({
      data: templateDto,
    });
    mocks.getConnection.mockResolvedValue({ data: aasConnection });
    mocks.getPropertiesOfAas.mockResolvedValue({ data: mockedProperties });
    await integrationFormStore.fetchConnection(connectionId);

    expect(integrationFormStore.fieldAssignments).toHaveLength(2);
    expect(integrationFormStore.fieldAssignments[0]).toEqual({
      id: expect.any(String),
      aas: "p1/i1",
      dpp: "s1/f1",
    });
    expect(integrationFormStore.fieldAssignments[1]).toEqual({
      id: expect.any(String),
      aas: "p2/i2",
      dpp: "s2/f2",
    });
  });

  it("should update connection", async () => {
    const integrationFormStore = useAasConnectionFormStore();
    
    // Setup mocks
    const newFieldAssignments: AasFieldAssignmentDto[] = [
      {
        idShortParent: "p1-update",
        idShort: "i1-update",
        dataFieldId: "f0",
        sectionId: "s0",
      },
      {
        idShortParent: "p2-update",
        idShort: "i2-update",
        dataFieldId: "f3",
        sectionId: "s2",
      },
    ];
    const mockedAasConnectionUpdate: AasConnectionDto = {
      ...aasConnection,
      fieldAssignments: newFieldAssignments,
    };
    mocks.getConnection.mockResolvedValue({
      data: aasConnection,
    });
    mocks.getTemplateById.mockResolvedValue({
      data: templateDto,
    });
    mocks.getPropertiesOfAas.mockResolvedValue({ data: mockedProperties });
    mocks.modifyConnection.mockResolvedValue({
      data: mockedAasConnectionUpdate,
    });

    await integrationFormStore.fetchConnection(connectionId);

    // Manually update fieldAssignments to simulate user input
    // We preserve the IDs from the fetch but change the values
    const currentAssignments = integrationFormStore.fieldAssignments;
    expect(currentAssignments).toHaveLength(2);

    currentAssignments[0]!.aas = "p1-update/i1-update";
    currentAssignments[0]!.dpp = "s0/f0";
    currentAssignments[1]!.aas = "p2-update/i2-update";
    currentAssignments[1]!.dpp = "s2/f3";
    
    // Update the store ref
    integrationFormStore.fieldAssignments = [...currentAssignments];

    await integrationFormStore.submitModifications();

    await waitFor(() =>
      expect(
        apiClient.dpp.aasIntegration.modifyConnection,
      ).toHaveBeenCalledWith(connectionId, {
        fieldAssignments: mockedAasConnectionUpdate.fieldAssignments,
        modelId: mockedAasConnectionUpdate.modelId,
        name: mockedAasConnectionUpdate.name,
      }),
    );

    // Verify the store state reflects the update (which it should if modifyConnection returns the updated dto)
    expect(integrationFormStore.fieldAssignments).toHaveLength(2);
    // Note: IDs might be regenerated or preserved depending on implementation. 
    // In current implementation, if aasConnection.value is updated from response, 
    // IDs are NOT regenerated because initializeFormData is NOT called in submitModifications 
    // EXCEPT if we manually trigger it or if the store watcher handles it.
    // Looking at the store code: 
    // aasConnection.value = response.data;
    // But initializeFormData is NOT called after this line in submitModifications.
    // Wait, the store implementation of submitModifications:
    // aasConnection.value = response.data;
    // It does NOT update fieldAssignments from the response. 
    // It relies on the local state being the source of truth for the UI?
    // Actually, if the backend returns normalized data, we might want to reload it.
    // But let's check what we expect. We updated the local state manually before submit.
    // So the local state should still have our values.
    
    expect(integrationFormStore.fieldAssignments[0]).toMatchObject({
      aas: "p1-update/i1-update",
      dpp: "s0/f0",
    });
    expect(integrationFormStore.fieldAssignments[1]).toMatchObject({
      aas: "p2-update/i2-update",
      dpp: "s2/f3",
    });
  });

  it("should add field assignment", async () => {
    const integrationFormStore = useAasConnectionFormStore();

    mocks.getTemplateById.mockResolvedValue({
      data: templateDto,
    });
    mocks.getConnection.mockResolvedValue({ data: aasConnection });
    mocks.getPropertiesOfAas.mockResolvedValue({ data: mockedProperties });
    await integrationFormStore.fetchConnection(connectionId);

    integrationFormStore.addFieldAssignmentRow();

    expect(integrationFormStore.fieldAssignments).toHaveLength(3);
    expect(integrationFormStore.fieldAssignments[2]).toEqual({
      id: expect.any(String),
      aas: "",
      dpp: "",
    });
  });

  it("should switch model", async () => {
    const integrationFormStore = useAasConnectionFormStore();

    mocks.getTemplateById.mockImplementation((id: string) =>
      id === templateDto.id
        ? {
            data: templateDto,
          }
        : {
            data: otherTemplateDto,
          },
    );
    const otherModelId = "otherModelId";
    mocks.getConnection.mockResolvedValue({ data: aasConnection });
    mocks.getPropertiesOfAas.mockResolvedValue({ data: mockedProperties });
    mocks.getModelById.mockResolvedValue({
      data: {
        modelId: otherModelId,
        templateId: otherTemplateDto.id,
      },
    });
    await integrationFormStore.fetchConnection(connectionId);
    const model: ModelDto = {
      name: "modelName",
      mediaReferences: [],
      id: otherModelId,
      templateId: otherTemplateDto.id,
      owner: "o1",
      uniqueProductIdentifiers: [],
      dataValues: [],
    };

    await integrationFormStore.switchModel(model);

    // Expect fieldAssignments to be updated
    // Original[0]: aas="p1/i1", dpp="s1/f1"
    // Original[1]: aas="p2/i2", dpp="s2/f2"
    
    // In otherTemplateDto:
    // "s1/f1" does NOT exist (it has "s1/f1-other") -> should be cleared
    // "s2/f2" DOES exist -> should be preserved

    expect(integrationFormStore.fieldAssignments).toHaveLength(2);
    
    expect(integrationFormStore.fieldAssignments[0]).toMatchObject({
      aas: "p1/i1",
      dpp: "", // Cleared because s1/f1 is not in otherTemplateDto
    });

    expect(integrationFormStore.fieldAssignments[1]).toMatchObject({
      aas: "p2/i2",
      dpp: "s2/f2", // Preserved
    });
  });
});
