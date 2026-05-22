import { activitiesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { useActivityTimeline } from "./activity-timeline.ts";
import { DataTypeDef, KeyTypes, OperationDtoTypes, SubmodelOperationDtoTypes } from "@open-dpp/dto";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref("en"),
  }),
  createI18n: vi.fn(() => ({
    global: {
      t: vi.fn(),
      locale: ref("en"),
      te: vi.fn(),
    },
  })),
}));

describe("activity timeline", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "use-activity-timeline-harness",
      setup() {
        const api = useActivityTimeline();
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useActivityTimeline>),
    };
  }

  const addIcon = "pi pi-plus";
  const removeIcon = "pi pi-trash";
  const editIcon = "pi pi-user-edit";
  const addOperation = "activityHistory.operations.add";
  const removeOperation = "activityHistory.operations.remove";
  const editOperation = "activityHistory.operations.replace";
  const createdAt = "2023-01-04T08:22:00.000Z";
  const createdAtFormatted = "January 4, 2023 9:22 AM";
  const displayName = "aasEditor.formLabels.name";
  const valueName = "aasEditor.formLabels.value";
  const rowTrans = "aasEditor.table.row";
  const columnTrans = "aasEditor.table.column";
  const positionTrans = "activityHistory.position";

  it("should create timeline items for display name", async () => {
    const addDisplayName = {
      op: OperationDtoTypes.Add,
      path: "/submodelElements/2/displayName/1",
      value: {
        language: "en",
        text: "Carbon footprint performance",
      },
      dpp: { p: "carbonFootprintPerformanceClass" },
    };

    const removeDisplayName = {
      op: OperationDtoTypes.Remove,
      path: "/submodelElements/2/displayName/1",
      dpp: {
        p: "carbonFootprintPerformanceClass",
      },
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [addDisplayName, removeDisplayName],
        command: { op: SubmodelOperationDtoTypes.SubmodelElementModified },
      },
    });

    const {
      createTimelineItemForProperty,
      createTimelineItemForFile,
      createTimelineItemForReferenceElement,
    } = mountHarness();
    const expectedAdd = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${displayName} ${addOperation}`,
      content: [{ value: "Carbon footprint performance" }],
      icon: addIcon,
    };
    expect(createTimelineItemForProperty(activity, addDisplayName)).toEqual(expectedAdd);
    expect(createTimelineItemForFile(activity, addDisplayName)).toEqual(expectedAdd);
    expect(createTimelineItemForReferenceElement(activity, addDisplayName)).toEqual(expectedAdd);
    const expectedRemove = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${displayName} ${removeOperation}`,
      icon: removeIcon,
      content: [],
    };
    expect(createTimelineItemForProperty(activity, removeDisplayName)).toEqual(expectedRemove);
    expect(createTimelineItemForFile(activity, removeDisplayName)).toEqual(expectedRemove);
    expect(createTimelineItemForReferenceElement(activity, removeDisplayName)).toEqual(
      expectedRemove,
    );
  });

  it("should create timeline items for Property", async () => {
    const valueModified = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/2/value",
      value: "9000",
      dpp: {
        p: "carbonFootprintPerformanceClass",
        m: KeyTypes.Property,
        v: DataTypeDef.String,
      },
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [valueModified],
      },
    });

    const { createTimelineItemForProperty } = mountHarness();

    expect(createTimelineItemForProperty(activity, valueModified)).toEqual({
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${valueName} ${editOperation}`,
      icon: editIcon,
      content: [{ value: `${valueName}: 9000` }],
    });
  });

  it("should create timeline items for ReferenceElement", async () => {
    const linkModifiedFromBlank = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/3/value",
      value: {
        type: "ExternalReference",
        referredSemanticId: null,
        keys: [
          {
            type: "GlobalReference",
            value: "https://concular.en",
          },
        ],
      },
      dpp: {
        p: "carbonFootprintStudy",
        m: KeyTypes.ReferenceElement,
      },
    };

    const linkModified = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/3/value/keys/0/value",
      value: "https://concular.en",
      dpp: { p: "carbonFootprintStudy", m: KeyTypes.ReferenceElement },
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [linkModifiedFromBlank, linkModified],
      },
    });

    const { createTimelineItemForReferenceElement } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${valueName} ${editOperation}`,
      icon: editIcon,
      content: [{ value: `${valueName}: https://concular.en` }],
    };
    expect(createTimelineItemForReferenceElement(activity, linkModifiedFromBlank)).toEqual(
      expectedResult,
    );
    expect(createTimelineItemForReferenceElement(activity, linkModified)).toEqual(expectedResult);
  });

  it("should create timeline items for File", async () => {
    const fileModified = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/2/value",
      value: "06c9736b-3323-4afe-bd00-e88aeb2a58ee",
      dpp: { p: "declarationOfConformity", m: KeyTypes.File },
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [fileModified],
      },
    });

    const { createTimelineItemForFile } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${valueName} ${editOperation}`,
      icon: editIcon,
      content: [{ value: `06c9736b-3323-4afe-bd00-e88aeb2a58ee`, renderContentAsFile: true }],
    };
    expect(createTimelineItemForFile(activity, fileModified)).toEqual(expectedResult);
  });

  it("should create timeline items for row addition", async () => {
    const rowAdded = {
      op: OperationDtoTypes.Add,
      path: "/submodelElements/0/value/4",
      value: {
        category: null,
        idShort: "row_d752fc20-6e62-4c03-83c4-bb03e238a260",
        displayName: [],
        description: [],
        semanticId: null,
        supplementalSemanticIds: [],
        qualifiers: [],
        embeddedDataSpecifications: [],
        modelType: "SubmodelElementCollection",
        extensions: [],
        value: [
          {
            modelType: "Property",
            category: null,
            idShort: "lifecycleStage",
            displayName: [
              {
                language: "de",
                text: "Lebensphase",
              },
              {
                language: "en",
                text: "Lifecycle stage",
              },
            ],
            description: [],
            semanticId: null,
            supplementalSemanticIds: [],
            qualifiers: [],
            embeddedDataSpecifications: [],
            extensions: [],
            valueType: "String",
            value: null,
            valueId: null,
          },
          {
            modelType: "Property",
            category: null,
            idShort: "carbonFootprint",
            displayName: [
              {
                language: "de",
                text: "CO₂-Fußabdruck [kgCO2e/kWh]",
              },
              {
                language: "en",
                text: "carbonFootprint [kgCO2e/kWh]",
              },
            ],
            description: [],
            semanticId: null,
            supplementalSemanticIds: [],
            qualifiers: [],
            embeddedDataSpecifications: [],
            extensions: [],
            valueType: "Double",
            value: null,
            valueId: null,
          },
        ],
      },
      dpp: { p: "carbonFootprintPerLifecycleStage.row_d752fc20-6e62-4c03-83c4-bb03e238a260" },
    };
    const rowMoved = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/0/value/4/idShort",
      value: "row_b151c0ab-ee4c-451e-a9bc-58881a8642b7",
      dpp: {
        p: "carbonFootprintPerLifecycleStage.row_cb5fccc6-093c-4201-8fa4-b6da3090dd81",
        m: KeyTypes.SubmodelElementCollection,
      },
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [rowAdded, rowMoved],
        command: {
          op: SubmodelOperationDtoTypes.SubmodelRowAdded,
        },
      },
    });

    const { createTimelineItemForList } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${rowTrans} ${addOperation}`,
      icon: addIcon,
      content: [{ value: `${positionTrans}: 5` }],
    };
    expect(createTimelineItemForList(activity, rowAdded)).toEqual(expectedResult);
    expect(createTimelineItemForList(activity, rowMoved)).toBeUndefined();
  });

  it("should create timeline items for row deletion", async () => {
    const rowDeleted = {
      op: OperationDtoTypes.Remove,
      path: "/submodelElements/0/value/4",
      dpp: { p: "carbonFootprintPerLifecycleStage.row_d752fc20-6e62-4c03-83c4-bb03e238a260" },
    };
    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [rowDeleted],
        command: {
          op: SubmodelOperationDtoTypes.SubmodelRowDeleted,
        },
      },
    });

    const { createTimelineItemForList } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${rowTrans} ${removeOperation}`,
      icon: removeIcon,
      content: [{ value: `${positionTrans}: 5` }],
    };
    expect(createTimelineItemForList(activity, rowDeleted)).toEqual(expectedResult);
  });

  it("should create timeline items for column added", async () => {
    const columnAdded0 = {
      op: OperationDtoTypes.Add,
      path: "/submodelElements/0/value/0/value/4",
      dpp: { p: "carbonFootprintPerLifecycleStage.row_0.col1" },
    };
    const columnAdded1 = {
      op: OperationDtoTypes.Add,
      path: "/submodelElements/0/value/1/value/4",
      dpp: { p: "carbonFootprintPerLifecycleStage.row_1.col1" },
    };
    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [columnAdded0, columnAdded1],
        command: {
          op: SubmodelOperationDtoTypes.SubmodelColumnAdded,
        },
      },
    });

    const { createTimelineItemForList } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${columnTrans} ${addOperation}`,
      icon: addIcon,
      content: [{ value: `${positionTrans}: 5` }],
    };
    expect(createTimelineItemForList(activity, columnAdded0)).toEqual(expectedResult);
    expect(createTimelineItemForList(activity, columnAdded1)).toBeUndefined();
  });

  it("should create timeline items for column deletion", async () => {
    const columnDeleted0 = {
      op: OperationDtoTypes.Remove,
      path: "/submodelElements/0/value/0/value/4",
      dpp: { p: "carbonFootprintPerLifecycleStage.row_0.col1" },
    };
    const columnDeleted1 = {
      op: OperationDtoTypes.Remove,
      path: "/submodelElements/0/value/1/value/4",
      dpp: { p: "carbonFootprintPerLifecycleStage.row_1.col1" },
    };
    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [columnDeleted0, columnDeleted1],
        command: {
          op: SubmodelOperationDtoTypes.SubmodelColumnDeleted,
        },
      },
    });

    const { createTimelineItemForList } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${columnTrans} ${removeOperation}`,
      icon: removeIcon,
      content: [{ value: `${positionTrans}: 5` }],
    };
    expect(createTimelineItemForList(activity, columnDeleted0)).toEqual(expectedResult);
  });

  it("should create timeline items for cell modification", async () => {
    const cellModified = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/0/value/0/value/1/value",
      value: "48939",
      dpp: {
        p: "carbonFootprintPerLifecycleStage.row_26a9f2ba-161b-4f33-8068-c0e2b5bf1606.carbonFootprint",
        m: KeyTypes.Property,
        v: DataTypeDef.Double,
      },
    };
    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [cellModified],
        command: {
          op: SubmodelOperationDtoTypes.SubmodelElementValueModified,
        },
      },
    });

    const { createTimelineItemForList } = mountHarness();
    const expectedResult = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      title: `${valueName} ${editOperation}`,
      icon: editIcon,
      content: [
        { value: `${rowTrans}: 1` },
        { value: `${columnTrans}: 2 (carbonFootprint)` },
        { value: `${valueName}: 48,939` },
      ],
    };
    expect(createTimelineItemForList(activity, cellModified)).toEqual(expectedResult);
  });
});
