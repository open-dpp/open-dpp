import { activitiesPlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";

import { HTTPCode } from "../stores/http-codes.ts";
import {
  DigitalProductDocumentType,
  type DigitalProductDocumentTypeType,
} from "../lib/digital-product-document.ts";
import { v4 as uuid4 } from "uuid";
import { useActivityHistory } from "./activity-history.ts";

const mocks = vi.hoisted(() => {
  return {
    getActivities: vi.fn(),
    downloadActivities: vi.fn(),
    query: vi.fn(),
    routerPush: vi.fn(),
  };
});

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mocks.query() }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      passports: {
        getActivities: mocks.getActivities,
        downloadActivities: mocks.downloadActivities,
      },
    },
  },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("activity history", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setActivePinia(createPinia());
  });

  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(type: DigitalProductDocumentTypeType) {
    const Harness = defineComponent({
      name: "use-activity-history-harness",
      setup() {
        const api = useActivityHistory(type);
        return { api };
      },
      template: "<div></div>",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useActivityHistory>),
    };
  }

  it("should change period", async () => {
    const startDate = "2022-01-01T00:00:00.000Z";
    const endDate = "2022-01-08T00:00:00.000Z";
    mocks.query.mockReturnValue({ startDate, endDate });
    const { period, changePeriod } = mountHarness(DigitalProductDocumentType.Passport);
    expect(period.value).toEqual([new Date(startDate), new Date(endDate)]);
    const modifiedStartDate = "2022-02-01T00:00:00.000Z";
    const modifiedEndDate = "2022-02-10T00:00:00.000Z";
    await changePeriod([new Date(modifiedStartDate), new Date(modifiedEndDate)]);
    expect(mocks.routerPush).toHaveBeenCalledWith({
      query: expect.objectContaining({ startDate: modifiedStartDate, endDate: modifiedEndDate }),
    });
    expect(period.value).toEqual([new Date(modifiedStartDate), new Date(modifiedEndDate)]);
  });

  it("should get activities", async () => {
    mocks.query.mockReturnValue({});
    const { activities, changePeriod, fetchActivities } = mountHarness(
      DigitalProductDocumentType.Passport,
    );
    const id = uuid4();
    const passportActivity1 = activitiesPlainFactory.build({ header: { aggregateId: id } });
    const passportActivity2 = activitiesPlainFactory.build({ header: { aggregateId: id } });
    mocks.getActivities.mockResolvedValueOnce({
      data: {
        paging_metadata: {
          cursor: passportActivity2.header.id,
        },
        result: [passportActivity1, passportActivity2],
      },
      status: HTTPCode.OK,
    });
    const newPeriod = {
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-01-08T00:00:00.000Z",
    };
    await changePeriod([new Date(newPeriod.startDate), new Date(newPeriod.endDate)]);

    await fetchActivities(id);

    expect(mocks.getActivities).toHaveBeenCalledWith(id, {
      pagination: { limit: 10, cursor: undefined },
      period: newPeriod,
    });
    expect(activities.value).toEqual([passportActivity1, passportActivity2]);
  });

  it("should download activities", async () => {
    mocks.query.mockReturnValue({});

    const createObjectURLSpy = vi
      .spyOn(window.URL, "createObjectURL")
      .mockReturnValue("blob:activities-url");

    const originalCreateElement = document.createElement.bind(document);

    const fakeLink = {
      href: "",
      setAttribute: vi.fn(),
      click: vi.fn(),
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string,
      options?: ElementCreationOptions,
    ) => {
      if (tagName === "a") {
        return fakeLink;
      }

      return originalCreateElement(tagName, options);
    }) as typeof document.createElement);

    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);

    const { downloadActivities, changePeriod } = mountHarness(DigitalProductDocumentType.Passport);
    const id = uuid4();

    const emptyZipBytes = new Uint8Array([
      0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    ]);

    const zipBlob = new Blob([emptyZipBytes], {
      type: "application/zip",
    });

    mocks.downloadActivities.mockResolvedValueOnce({
      status: HTTPCode.OK,
      data: zipBlob,
      headers: {
        "content-type": "application/zip",
        "content-disposition": 'attachment; filename="activities.zip"',
      },
    });

    const newPeriod = {
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-01-08T00:00:00.000Z",
    };

    await changePeriod([new Date(newPeriod.startDate), new Date(newPeriod.endDate)]);

    await downloadActivities(id);

    expect(mocks.downloadActivities).toHaveBeenCalledWith(id, {
      period: newPeriod,
    });

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(fakeLink.setAttribute).toHaveBeenCalledWith("download", "activities.zip");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(fakeLink.click).toHaveBeenCalledTimes(1);
    expect(fakeLink.remove).toHaveBeenCalledTimes(1);
  });
});
