import { beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { useDigitalProductDocumentListFilter } from "./digital-product-document-list-filter.ts";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  routerReplace: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mocks.query() }),
  useRouter: () => ({ replace: mocks.routerReplace }),
}));

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
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-02-01T00:00:00.000Z",
    });
    const { filter, period, hasActiveFilters } = mountHarness({ withTemplateIds: true });
    expect(filter.value).toEqual({
      status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
      templateIds: ["t1", "t2"],
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-02-01T00:00:00.000Z",
    });
    expect(period.value).toEqual([
      new Date("2022-01-01T00:00:00.000Z"),
      new Date("2022-02-01T00:00:00.000Z"),
    ]);
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

  it("converts the period to ISO instants and supports open-ended ranges", async () => {
    const { setPeriod, filter } = mountHarness();
    const start = new Date("2022-01-01T10:00:00.000Z");
    const end = new Date("2022-01-05T10:00:00.000Z");
    await setPeriod([start, end]);
    expect(filter.value).toEqual({
      startDate: "2022-01-01T10:00:00.000Z",
      endDate: "2022-01-05T10:00:00.000Z",
    });
    expect(mocks.routerReplace).toHaveBeenLastCalledWith({
      query: expect.objectContaining({
        startDate: "2022-01-01T10:00:00.000Z",
        endDate: "2022-01-05T10:00:00.000Z",
      }),
    });

    await setPeriod([start, null]);
    expect(filter.value).toEqual({ startDate: "2022-01-01T10:00:00.000Z" });

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
