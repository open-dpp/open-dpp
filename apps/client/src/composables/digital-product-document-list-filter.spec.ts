import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { makeDayPeriod } from "../lib/day-period.ts";
import { useDigitalProductDocumentListFilter } from "./digital-product-document-list-filter.ts";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mocks.query() }),
  useRouter: () => ({ replace: mocks.routerReplace }),
}));

// Local dates, because the filter covers whole days in the timezone of the user.
const startOfJan1 = new Date(2022, 0, 1);
const endOfFeb1 = new Date(2022, 1, 1, 23, 59, 59, 999);

describe("useDigitalProductDocumentListFilter", () => {
  function mountHarness(options?: { withTemplateIds?: boolean }) {
    const Harness = defineComponent({
      setup() {
        return { api: useDigitalProductDocumentListFilter(options) };
      },
      template: "<div />",
    });
    const wrapper = mount(Harness);
    return wrapper.vm.api as ReturnType<typeof useDigitalProductDocumentListFilter>;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.query.mockReturnValue({});
  });

  it("has no filter by default", () => {
    const { status, templateIds, period, filter, hasActiveFilters } = mountHarness({
      withTemplateIds: true,
    });
    expect(status.value).toEqual([]);
    expect(templateIds.value).toEqual([]);
    expect(period.value).toBeNull();
    expect(filter.value).toEqual({});
    expect(hasActiveFilters.value).toBe(false);
  });

  it("derives the filter from the URL query", () => {
    mocks.query.mockReturnValue({
      status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
      templateId: ["t1", "t2"],
      startDate: startOfJan1.toISOString(),
      endDate: endOfFeb1.toISOString(),
    });
    const { filter, period, hasActiveFilters } = mountHarness({ withTemplateIds: true });
    expect(filter.value).toEqual({
      status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
      templateIds: ["t1", "t2"],
      startDate: startOfJan1.toISOString(),
      endDate: endOfFeb1.toISOString(),
    });
    expect(period.value?.toPickerValue()).toEqual([startOfJan1, endOfFeb1]);
    expect(hasActiveFilters.value).toBe(true);
  });

  it("accepts a single status and ignores invalid query values", () => {
    mocks.query.mockReturnValue({
      status: DigitalProductDocumentStatusDto.Archived,
      startDate: "not-a-date",
    });
    const { status, period } = mountHarness();
    expect(status.value).toEqual([DigitalProductDocumentStatusDto.Archived]);
    expect(period.value).toBeNull();
    mocks.query.mockReturnValue({ status: ["Unknown", DigitalProductDocumentStatusDto.Draft] });
    expect(mountHarness().status.value).toEqual([DigitalProductDocumentStatusDto.Draft]);
  });

  it("ignores template ids when templates are not enabled", () => {
    mocks.query.mockReturnValue({ templateId: ["t1"] });
    const { templateIds, filter } = mountHarness();
    expect(templateIds.value).toEqual([]);
    expect(filter.value).toEqual({});
  });

  it("writes the status to the query and drops the cursor", async () => {
    mocks.query.mockReturnValue({ cursor: "abc", other: "keep" });
    const { setStatus, filter } = mountHarness();
    await setStatus([DigitalProductDocumentStatusDto.Published]);
    expect(filter.value).toEqual({ status: [DigitalProductDocumentStatusDto.Published] });
    expect(mocks.routerReplace).toHaveBeenCalledWith({
      query: {
        other: "keep",
        status: [DigitalProductDocumentStatusDto.Published],
        templateId: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    });
  });

  it("covers whole days: from the start of the first to the end of the last day", async () => {
    const { setPeriod, filter, period } = mountHarness();
    // the picker emits dates at midnight, times of day are ignored
    await setPeriod(makeDayPeriod(new Date(2022, 0, 1, 10, 30), new Date(2022, 0, 5)));
    expect(period.value?.toPickerValue()).toEqual([
      new Date(2022, 0, 1),
      new Date(2022, 0, 5, 23, 59, 59, 999),
    ]);
    expect(filter.value).toEqual({
      startDate: new Date(2022, 0, 1).toISOString(),
      endDate: new Date(2022, 0, 5, 23, 59, 59, 999).toISOString(),
    });
    expect(mocks.routerReplace).toHaveBeenLastCalledWith({
      query: expect.objectContaining({
        startDate: new Date(2022, 0, 1).toISOString(),
        endDate: new Date(2022, 0, 5, 23, 59, 59, 999).toISOString(),
      }),
    });
  });

  it("supports open-ended ranges and clearing the period", async () => {
    const { setPeriod, filter } = mountHarness();
    await setPeriod(makeDayPeriod(new Date(2022, 0, 1)));
    expect(filter.value).toEqual({ startDate: new Date(2022, 0, 1).toISOString() });

    await setPeriod(null);
    expect(filter.value).toEqual({});
  });

  it("writes template ids to the query", async () => {
    const { setTemplateIds, filter } = mountHarness({ withTemplateIds: true });
    await setTemplateIds(["t1", "t2"]);
    expect(filter.value).toEqual({ templateIds: ["t1", "t2"] });
    expect(mocks.routerReplace).toHaveBeenCalledWith({
      query: expect.objectContaining({ templateId: ["t1", "t2"] }),
    });
  });

  it("resets every filter", async () => {
    mocks.query.mockReturnValue({
      status: DigitalProductDocumentStatusDto.Draft,
      templateId: "t1",
      startDate: "2022-01-01T00:00:00.000Z",
    });
    const { reset, filter, hasActiveFilters } = mountHarness({ withTemplateIds: true });
    expect(hasActiveFilters.value).toBe(true);
    await reset();
    expect(filter.value).toEqual({});
    expect(hasActiveFilters.value).toBe(false);
    expect(mocks.routerReplace).toHaveBeenLastCalledWith({
      query: {
        status: undefined,
        templateId: undefined,
        startDate: undefined,
        endDate: undefined,
      },
    });
  });
});
