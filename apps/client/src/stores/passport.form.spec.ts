import type {
  DataFieldDto,
  DataSectionDto,
  DataValueDto,
  ItemDto,
  ProductPassportDto,
} from "@open-dpp/api-client";
import {
  DataFieldType,
  GranularityLevel,
  SectionType,
} from "@open-dpp/api-client";
import { createPinia, setActivePinia } from "pinia";
import { expect, it, vi } from "vitest";
import { usePassportFormStore } from "./passport.form";

const mocks = vi.hoisted(() => {
  return {
    addData: vi.fn(),
    getModelById: vi.fn(),
    getItemById: vi.fn(),
    getProductPassportById: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      models: {
        addData: mocks.addData,
        getById: mocks.getModelById,
      },
      items: {
        getById: mocks.getItemById,
      },
      productPassports: {
        getById: mocks.getProductPassportById,
      },
    },
  },
}));

describe("passportFormStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("should merge data values with form data", async () => {
    const passportFormStore = usePassportFormStore();

    passportFormStore.productPassport = {
      id: "pid",
      name: "Handy",
      description: "Handy Desc",
      mediaReferences: [],
      dataSections: [
        {
          id: "s1",
          name: "Tech Specs",
          type: SectionType.GROUP,
          dataFields: [
            {
              id: "field1",
              type: DataFieldType.TEXT_FIELD,
              name: "Processor",
              options: {},
              granularityLevel: GranularityLevel.MODEL,
            },
            {
              id: "field2",
              type: DataFieldType.TEXT_FIELD,
              name: "RAM",
              options: {},
              granularityLevel: GranularityLevel.MODEL,
            },
          ],
          dataValues: [
            {
              field1: 2,
              field2: undefined,
            },
          ],
          subSections: ["s1-1"],
        },
        {
          id: "s1-1",
          name: "Sub Tech Specs",
          type: SectionType.GROUP,
          dataFields: [
            {
              id: "field3",
              type: DataFieldType.TEXT_FIELD,
              name: "Processor",
              options: {},
              granularityLevel: GranularityLevel.MODEL,
            },
            {
              id: "field4",
              type: DataFieldType.TEXT_FIELD,
              name: "RAM",
              options: {},
              granularityLevel: GranularityLevel.MODEL,
            },
          ],
          dataValues: [
            {
              field3: 7,
              field4: 9,
            },
          ],
          subSections: [],
        },
      ],
      organizationName: "Org A",
      organizationImage: "orga-a-image",
    };

    let result = passportFormStore.getFormData("s1", { field1: 8 });
    expect(result).toEqual({
      field1: 8,
      field2: undefined,
    });

    result = passportFormStore.getFormData("s1-1", { field3: 9 });
    expect(result).toEqual({
      field3: 9,
      field4: 9,
    });
  });

  const dataFieldS1F1: DataFieldDto = {
    id: "s1-f1",
    type: DataFieldType.TEXT_FIELD,
    name: "Processor",
    options: {},
    granularityLevel: GranularityLevel.MODEL,
  };

  const section11Id = "s1-1";
  const section111Id = "s1-1-1";

  const section1: DataSectionDto = {
    id: "s1",
    type: SectionType.REPEATABLE,
    parentId: undefined,
    name: "Tech Specs",
    dataFields: [dataFieldS1F1],
    subSections: [section11Id],
    dataValues: [
      {
        [dataFieldS1F1.id]: 2,
      },
      {
        [dataFieldS1F1.id]: 2,
      },
    ],
  };

  const section11: DataSectionDto = {
    id: section11Id,
    type: SectionType.GROUP,
    parentId: section1.id,
    name: "Dimensions",
    dataFields: [],
    subSections: ["s1-1-1"],
    dataValues: [],
  };

  const dataFieldS111F1: DataFieldDto = {
    id: "s1-1-1-f1",
    type: DataFieldType.TEXT_FIELD,
    name: "Amount",
    options: {},
    granularityLevel: GranularityLevel.MODEL,
  };

  const dataFieldS111F2: DataFieldDto = {
    id: "s1-1-1-f2",
    type: DataFieldType.TEXT_FIELD,
    name: "Unit",
    options: {},
    granularityLevel: GranularityLevel.MODEL,
  };

  const section111: DataSectionDto = {
    id: section111Id,
    type: SectionType.GROUP,
    parentId: section11.id,
    name: "Single Dimension",
    dataFields: [dataFieldS111F1, dataFieldS111F2],
    subSections: [],
    dataValues: [
      {
        [dataFieldS111F1.id]: 7,
        [dataFieldS111F2.id]: 9,
      },
      {
        [dataFieldS111F1.id]: 7,
        [dataFieldS111F2.id]: 9,
      },
    ],
  };

  const productPassportDto: ProductPassportDto = {
    id: "pid",
    name: "Handy",
    description: "Handy desc",
    mediaReferences: [],
    dataSections: [section1, section11, section111],
    organizationName: "Org A",
    organizationImage: "orga-a-image",
  };

  const model = {
    id: "id1",
    uniqueProductIdentifiers: [{ uuid: "uuid1", referenceId: "id1" }],
  };

  it("should getFormSchema", async () => {
    const dataFieldS1Model: DataFieldDto = {
      id: "f1",
      type: DataFieldType.TEXT_FIELD,
      name: "Amount",
      options: {},
      granularityLevel: GranularityLevel.MODEL,
    };
    const dataFieldS1Item: DataFieldDto = {
      id: "f2",
      type: DataFieldType.TEXT_FIELD,
      name: "PCF",
      options: {},
      granularityLevel: GranularityLevel.ITEM,
    };
    const section1Group: DataSectionDto = {
      id: "s1",
      type: SectionType.GROUP,
      parentId: undefined,
      name: "Tech Specs",
      dataFields: [dataFieldS1Model, dataFieldS1Item],
      subSections: [],
      dataValues: [],
    };
    const productPassportDto: ProductPassportDto = {
      id: "pid",
      name: "Handy",
      description: "1.0.0",
      mediaReferences: [],
      dataSections: [section1Group],
      organizationName: "Org A",
      organizationImage: "orga-a-image",
    };

    const model = {
      id: "id1",
      uniqueProductIdentifiers: [{ uuid: "uuid1", referenceId: "id1" }],
    };

    const passportFormStore = usePassportFormStore();
    mocks.getModelById.mockResolvedValue({ data: model });
    mocks.getProductPassportById.mockResolvedValue({
      data: productPassportDto,
    });
    await passportFormStore.fetchModel(model.id);

    const result = passportFormStore.getFormSchema(section1Group);
    expect(result).toEqual([
      {
        $el: "div",
        attrs: {
          class:
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-center",
        },
        children: [
          {
            $cmp: "TextField",
            props: {
              dataCy: "f1",
              id: "f1",
              label: "Amount",
              name: "f1",
              options: {},
              validation: "required",
            },
          },
          {
            $cmp: "FakeField",
            props: {
              dataCy: "f2",
              label: "PCF",
              options: {},
              placeholder: "Wird auf Artikelebene gesetzt",
            },
          },
        ],
      },
    ]);
  });

  it("should getFormSchema at item level", async () => {
    const dataFieldS1Model: DataFieldDto = {
      id: "f1",
      type: DataFieldType.TEXT_FIELD,
      name: "Amount",
      options: {},
      granularityLevel: GranularityLevel.MODEL,
    };
    const dataFieldS1Item: DataFieldDto = {
      id: "f2",
      type: DataFieldType.TEXT_FIELD,
      name: "PCF",
      options: {},
      granularityLevel: GranularityLevel.ITEM,
    };
    const section1Group: DataSectionDto = {
      id: "s1",
      type: SectionType.GROUP,
      parentId: undefined,
      name: "Tech Specs",
      dataFields: [dataFieldS1Model, dataFieldS1Item],
      subSections: [],
      dataValues: [],
    };
    const productPassportDto: ProductPassportDto = {
      id: "pid",
      name: "Handy",
      description: "Handy Desc",
      mediaReferences: [],
      dataSections: [section1Group],
      organizationName: "Org A",
      organizationImage: "orga-a-image",
    };

    const modelId = "mid";
    const item: ItemDto = {
      id: "id1",
      uniqueProductIdentifiers: [],
      templateId: "pid",
      dataValues: [
        {
          value: undefined,
          dataSectionId: section1Group.id,
          dataFieldId: dataFieldS1Item.id,
          row: 0,
        },
      ],
    };

    const passportFormStore = usePassportFormStore();
    mocks.getItemById.mockResolvedValue({ data: item });
    mocks.getProductPassportById.mockResolvedValue({
      data: productPassportDto,
    });
    await passportFormStore.fetchItem(modelId, item.id);

    const result = passportFormStore.getFormSchema(section1Group);
    expect(result).toEqual([
      {
        $el: "div",
        attrs: {
          class:
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 items-center",
        },
        children: [
          {
            $cmp: "FakeField",
            props: {
              dataCy: "f1",
              label: "Amount",
              options: {},
              placeholder: "Wird auf Modelebene gesetzt",
            },
          },
          {
            $cmp: "TextField",
            props: {
              dataCy: "f2",
              id: "f2",
              label: "PCF",
              name: "f2",
              options: {},
              validation: "required",
            },
          },
        ],
      },
    ]);
  });

  it("should add row to section", async () => {
    const passportFormStore = usePassportFormStore();
    mocks.getProductPassportById.mockResolvedValue({
      data: productPassportDto,
    });
    mocks.getModelById.mockResolvedValue({ data: model });
    await passportFormStore.fetchModel(model.id);

    const expected: DataValueDto[] = [
      {
        value: undefined,
        dataSectionId: section111.id,
        dataFieldId: dataFieldS111F1.id,
        row: 2,
      },
      {
        value: undefined,
        dataSectionId: section111.id,
        dataFieldId: dataFieldS111F2.id,
        row: 2,
      },
      {
        value: undefined,
        dataSectionId: section1.id,
        dataFieldId: dataFieldS1F1.id,
        row: 2,
      },
    ];
    await passportFormStore.addRowToSection(section1.id);

    expect(mocks.addData).toHaveBeenCalledWith(model.id, expected);
  });
});
