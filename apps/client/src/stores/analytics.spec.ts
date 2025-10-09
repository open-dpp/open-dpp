import type { PassportMeasurementDto } from "@open-dpp/api-client";
import { MeasurementType, TimePeriod } from "@open-dpp/api-client";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAnalyticsStore } from "./analytics";

const mocks = vi.hoisted(() => {
  return {
    addPageView: vi.fn(),
    queryMetric: vi.fn(),
    route: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    analytics: {
      passportMetric: {
        addPageView: mocks.addPageView,
        query: mocks.queryMetric,
      },
    },
  },
}));

const passportUUID = "p1-uuid";

vi.mock("vue-router", () => ({
  useRoute: mocks.route,
}));

const mockWindow = {
  location: { href: `http://example.com/${passportUUID}` },
};

// Set up the global window object
vi.stubGlobal("window", mockWindow);

describe("analyticsStore", () => {
  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should add current page view", async () => {
    const page = `http://example.com/${passportUUID}`;
    mocks.route.mockReturnValueOnce({
      params: {
        permalink: passportUUID,
      },
    });
    const analyticsStore = useAnalyticsStore();
    mocks.addPageView.mockResolvedValueOnce({ id: "metric1" });
    await analyticsStore.addPageView();
    expect(mocks.addPageView).toHaveBeenCalledWith({
      uuid: passportUUID,
      page,
    });
  });

  it.skip("should query metric", async () => {
    const measurements: PassportMeasurementDto[] = [
      {
        datetime: "2022-01-01T00:00:00.000Z",
        sum: 2,
      },
      {
        datetime: "2022-01-02T00:00:00.000Z",
        sum: 5,
      },
    ];
    mocks.queryMetric.mockResolvedValue({ data: measurements });
    const analyticsStore = useAnalyticsStore();
    const query = {
      startDate: new Date("2022-01-01T00:00:00.000Z"),
      endDate: new Date("2022-12-01T00:00:00.000Z"),
      templateId: "t1",
      modelId: "m1",
      valueKey: "http://example.com/",
      type: MeasurementType.PAGE_VIEWS,
      period: TimePeriod.DAY,
    };
    await analyticsStore.queryMetric(query);
    expect(mocks.queryMetric).toHaveBeenCalledWith(query);
    expect(analyticsStore.getMeasurementsAsTimeseries()).toEqual([
      {
        x: "01.01",
        y: 2,
      },
      {
        x: "02.01",
        y: 5,
      },
    ]);
  });
});
