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
      t: (key: string) => key,
      locale: ref("en"),
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
  const addOperation = "activityHistory.operations.add";
  const removeOperation = "activityHistory.operations.remove";
  const createdAt = "2023-01-04T08:22:00.000Z";
  const createdAtFormatted = "January 4, 2023 9:22 AM";
  const displayName = "aasEditor.formLabels.name";

  it("should create timeline items for Property", async () => {
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

    const { createTimelineItemForProperty } = mountHarness();
    expect(createTimelineItemForProperty(activity, addDisplayName, DataTypeDef.String)).toEqual({
      id: activity.header.id,
      timestamp: createdAtFormatted,
      attribute: displayName,
      operation: addOperation,
      value: "Carbon footprint performance",
      icon: addIcon,
    });

    expect(createTimelineItemForProperty(activity, removeDisplayName, DataTypeDef.String)).toEqual({
      id: activity.header.id,
      timestamp: createdAtFormatted,
      attribute: displayName,
      operation: removeOperation,
      icon: removeIcon,
    });
  });
});
