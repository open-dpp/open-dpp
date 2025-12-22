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
      oldTemplates: {
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

  const selectOptionsAas = [
    {
      group: "p1",
      options: [
        {
          label: "i1",
          property: {
            idShort: "i1",
            modelType: "Property",
            valueType: "xs:string",
          },
          value: "p1/i1",
        },
      ],
    },
    {
      group: "p2",
      options: [
        {
          label: "i2",
          property: {
            idShort: "i2",
            modelType: "Property",
            valueType: "xs:string",
          },
          value: "p2/i2",
        },
      ],
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

  const selectOptionsOfOtherTemplate = [
    {
      group: "Section 0",
      options: [
        {
          label: "Field 0",
          value: "s0/f0",
        },
      ],
    },
    {
      group: "Section 1",
      options: [
        {
          label: "Field 1 other",
          value: "s1/f1-other",
        },
      ],
    },
    {
      group: "Section 2",
      options: [
        {
          label: "Field 2",
          value: "s2/f2",
        },
        {
          label: "Field 3 other",
          value: "s2/f3-other",
        },
      ],
    },
  ];

  const selectOptionsOfTemplate = [
    {
      group: "Section 0",
      options: [
        {
          label: "Field 0",
          value: "s0/f0",
        },
      ],
    },
    {
      group: "Section 1",
      options: [
        {
          label: "Field 1",
          value: "s1/f1",
        },
      ],
    },
    {
      group: "Section 2",
      options: [
        {
          label: "Field 2",
          value: "s2/f2",
        },
        {
          label: "Field 3",
          value: "s2/f3",
        },
      ],
    },
  ];

  const rowDiv = {
    $el: "div",
    attrs: {
      class: "flex flex-col md:flex-row justify-around gap-2 items-center",
    },
    children: [],
  };

  const horizontalLine = {
    $el: "div",
    attrs: {
      class: "w-full border-t border-gray-300 m-2",
    },
  };

  const connectedMsgDiv = {
    $el: "div",
    attrs: {
      class: "flex",
    },
    children: "ist verknüpft mit",
  };

  const flexDivStart = {
    $el: "div",
    attrs: {
      class: "flex",
    },
  };

  const placeHolderAas
    = "Wählen Sie ein Feld aus der Asset Administration Shell";
  const placeHolderDpp = "Wählen Sie ein Feld aus dem Produktdatenmodell";
  const labelAas = "Feld aus der Asset Administration Shell";
  const labelDpp = "Feld aus dem Produktdatenmodell";

  const expectedFormSchema = [
    {
      ...rowDiv,
      children: [
        {
          ...flexDivStart,
          children: [
            {
              "$formkit": "select",
              "label": labelAas,
              "placeholder": placeHolderAas,
              "name": `aas-${0}`,
              "options": selectOptionsAas,
              "data-cy": "aas-select-0",
              "required": true,
            },
          ],
        },
        connectedMsgDiv,
        {
          ...flexDivStart,
          children: [
            {
              "$formkit": "select",
              "label": labelDpp,
              "placeholder": placeHolderDpp,
              "name": `dpp-${0}`,
              "options": selectOptionsOfTemplate,
              "data-cy": "dpp-select-0",
              "required": true,
            },
          ],
        },
      ],
      rowIndex: 0,
    },
    horizontalLine,
    {
      ...rowDiv,
      children: [
        {
          ...flexDivStart,
          children: [
            {
              "$formkit": "select",
              "label": labelAas,
              "placeholder": placeHolderAas,
              "name": `aas-${1}`,
              "options": selectOptionsAas,
              "data-cy": "aas-select-1",
              "required": true,
            },
          ],
        },
        connectedMsgDiv,
        {
          ...flexDivStart,
          children: [
            {
              "$formkit": "select",
              "label": labelDpp,
              "placeholder": placeHolderDpp,
              "name": `dpp-${1}`,
              "options": selectOptionsOfTemplate,
              "data-cy": "dpp-select-1",
              "required": true,
            },
          ],
        },
      ],
      rowIndex: 1,
    },
  ];
  it("should initialize formSchema and formData correctly", async () => {
    const integrationFormStore = useAasConnectionFormStore();

    mocks.getTemplateById.mockResolvedValue({
      data: templateDto,
    });
    mocks.getConnection.mockResolvedValue({ data: aasConnection });
    mocks.getPropertiesOfAas.mockResolvedValue({ data: mockedProperties });
    await integrationFormStore.fetchConnection(connectionId);

    expect(integrationFormStore.formSchema).toEqual(expectedFormSchema);

    expect(integrationFormStore.formData).toEqual({
      "aas-0": "p1/i1",
      "aas-1": "p2/i2",
      "dpp-0": "s1/f1",
      "dpp-1": "s2/f2",
    });
  });

  it("should update connection", async () => {
    const integrationFormStore = useAasConnectionFormStore();
    const formUpdate = {
      name: "Connection 1",
      modelId: "modelId",
      fieldAssignments: {
        "aas-0": "p1-update/i1-update",
        "aas-1": "p2-update/i2-update",
        "dpp-0": "s0/f0",
        "dpp-1": "s2/f3",
      },
    };
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
    integrationFormStore.formData = formUpdate.fieldAssignments;
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

    expect(integrationFormStore.formSchema).toEqual(expectedFormSchema);
    expect(integrationFormStore.formData).toEqual({
      "aas-0": "p1-update/i1-update",
      "aas-1": "p2-update/i2-update",
      "dpp-0": "s0/f0",
      "dpp-1": "s2/f3",
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

    expect(integrationFormStore.formSchema).toEqual([
      ...expectedFormSchema,
      horizontalLine,
      {
        ...rowDiv,
        children: [
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelAas,
                "name": `aas-${2}`,
                "placeholder": placeHolderAas,
                "options": selectOptionsAas,
                "data-cy": "aas-select-2",
                "required": true,
              },
            ],
          },
          connectedMsgDiv,
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelDpp,
                "name": `dpp-${2}`,
                "placeholder": placeHolderDpp,
                "options": selectOptionsOfTemplate,
                "data-cy": "dpp-select-2",
                "required": true,
              },
            ],
          },
        ],
        rowIndex: 2,
      },
    ]);

    expect(integrationFormStore.formData).toEqual({
      "aas-0": "p1/i1",
      "aas-1": "p2/i2",
      "dpp-0": "s1/f1",
      "dpp-1": "s2/f2",
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

    expect(integrationFormStore.formSchema).toEqual([
      {
        ...rowDiv,
        children: [
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelAas,
                "placeholder": placeHolderAas,
                "name": `aas-${0}`,
                "options": selectOptionsAas,
                "data-cy": "aas-select-0",
                "required": true,
              },
            ],
          },
          connectedMsgDiv,
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelDpp,
                "placeholder": placeHolderDpp,
                "name": `dpp-${0}`,
                "options": selectOptionsOfOtherTemplate,
                "data-cy": "dpp-select-0",
                "required": true,
              },
            ],
          },
        ],
        rowIndex: 0,
      },
      horizontalLine,
      {
        ...rowDiv,
        children: [
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelAas,
                "placeholder": placeHolderAas,
                "name": `aas-${1}`,
                "options": selectOptionsAas,
                "data-cy": "aas-select-1",
                "required": true,
              },
            ],
          },
          connectedMsgDiv,
          {
            ...flexDivStart,
            children: [
              {
                "$formkit": "select",
                "label": labelDpp,
                "placeholder": placeHolderDpp,
                "name": `dpp-${1}`,
                "options": selectOptionsOfOtherTemplate,
                "data-cy": "dpp-select-1",
                "required": true,
              },
            ],
          },
        ],
        rowIndex: 1,
      },
    ]);

    expect(integrationFormStore.formData).toEqual({
      "aas-0": "p1/i1",
      "aas-1": "p2/i2",
      "dpp-0": "",
      "dpp-1": "s2/f2",
    });
  });
});
