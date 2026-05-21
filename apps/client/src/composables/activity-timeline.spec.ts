import { activitiesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { useActivityTimeline } from "./activity-timeline.ts";
import { DataTypeDef, OperationDtoTypes } from "@open-dpp/dto";
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

  it("should create timeline items for display name", async () => {
    const addDisplayName = {
      op: OperationDtoTypes.Add,
      path: "/submodelElements/2/displayName/1",
      value: {
        language: "en",
        text: "Carbon footprint performance",
      },
      dpp: "carbonFootprintPerformanceClass",
    };

    const removeDisplayName = {
      op: OperationDtoTypes.Remove,
      path: "/submodelElements/2/displayName/1",
      dpp: "carbonFootprintPerformanceClass",
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [addDisplayName, removeDisplayName],
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
      attribute: displayName,
      operation: addOperation,
      value: "Carbon footprint performance",
      icon: addIcon,
    };
    expect(createTimelineItemForProperty(activity, addDisplayName, DataTypeDef.String)).toEqual(
      expectedAdd,
    );
    expect(createTimelineItemForFile(activity, addDisplayName)).toEqual(expectedAdd);
    expect(createTimelineItemForReferenceElement(activity, addDisplayName)).toEqual(expectedAdd);
    const expectedRemove = {
      id: activity.header.id,
      timestamp: createdAtFormatted,
      attribute: displayName,
      operation: removeOperation,
      icon: removeIcon,
    };
    expect(createTimelineItemForProperty(activity, removeDisplayName, DataTypeDef.String)).toEqual(
      expectedRemove,
    );
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
      dpp: "carbonFootprintPerformanceClass",
    };

    const activity = activitiesPlainFactory.build({
      header: { createdAt },
      payload: {
        changes: [valueModified],
      },
    });

    const { createTimelineItemForProperty } = mountHarness();

    expect(createTimelineItemForProperty(activity, valueModified, DataTypeDef.String)).toEqual({
      id: activity.header.id,
      timestamp: createdAtFormatted,
      attribute: valueName,
      operation: editOperation,
      icon: editIcon,
      value: "9000",
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
      dpp: "carbonFootprintStudy",
    };

    const linkModified = {
      op: OperationDtoTypes.Replace,
      path: "/submodelElements/3/value/keys/0/value",
      value: "https://concular.en",
      dpp: "carbonFootprintStudy",
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
      attribute: valueName,
      operation: editOperation,
      icon: editIcon,
      value: "https://concular.en",
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
      dpp: "declarationOfConformity",
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
      attribute: valueName,
      operation: editOperation,
      icon: editIcon,
      value: "06c9736b-3323-4afe-bd00-e88aeb2a58ee",
      renderValueAsFile: true,
    };
    expect(createTimelineItemForFile(activity, fileModified)).toEqual(expectedResult);
  });
});
