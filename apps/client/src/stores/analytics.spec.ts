import type { PassportMeasurementDto } from "@open-dpp/api-client";
import { MeasurementType, TimePeriod } from "@open-dpp/api-client";
import { omit } from "lodash";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeView, useAnalyticsStore } from "./analytics";

const mocks = vi.hoisted(() => {
  return {
    addPageView: vi.fn(),
    queryMetric: vi.fn(),
    route: vi.fn(),
    getCurrentTimezone: vi.fn(),
    getNow: vi.fn(),
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

vi.mock("../lib/time", () => ({
  getCurrentTimezone: mocks.getCurrentTimezone,
  getNowInCurrentTimezone: mocks.getNow,
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

  it("should query metric", async () => {
    mocks.getCurrentTimezone.mockReturnValue("Europe/Berlin");
    const measurements: PassportMeasurementDto[] = [
      {
        datetime: "2022-01-03T00:00:00.000Z",
        sum: 2,
      },
      {
        datetime: "2022-01-04T00:00:00.000Z",
        sum: 5,
      },
    ];
    mocks.queryMetric.mockResolvedValue({ data: measurements });
    const analyticsStore = useAnalyticsStore();
    const query = {
      startDate: new Date("2022-01-01T23:00:00.000Z"),
      endDate: new Date("2022-01-08T22:59:59.999Z"),
      templateId: "t1",
      modelId: "m1",
      valueKey: "http://example.com/",
      type: MeasurementType.PAGE_VIEWS,
      selectedView: TimeView.WEEKLY,
    };
    await analyticsStore.queryMetric(query);
    expect(mocks.queryMetric).toHaveBeenCalledWith({
      ...omit(query, "selectedView"),
      startDate: new Date("2022-01-01T23:00:00.000Z"),
      endDate: new Date("2022-01-08T22:59:59.999Z"),
      period: TimePeriod.DAY,
      timezone: "Europe/Berlin",
    });
    expect(analyticsStore.getMeasurementsAsTimeseries()).toEqual([
      {
        x: "Monday",
        y: 2,
      },
      {
        x: "Tuesday",
        y: 5,
      },
    ]);
  });
});
