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
import type { PeriodDto } from "@open-dpp/dto";

const mocks = vi.hoisted(() => {
  return {
    getActivities: vi.fn(),
    downloadActivities: vi.fn(),
  };
});

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

  it("should get activities", async () => {
    const { getActivities } = mountHarness(DigitalProductDocumentType.Passport);
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
    const period: PeriodDto = {
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-01-08T00:00:00.000Z",
    };

    const { result } = await getActivities(id, { period });

    expect(mocks.getActivities).toHaveBeenCalledWith(id, {
      pagination: { limit: 10, cursor: undefined },
      period,
    });
    expect(result).toEqual([passportActivity1, passportActivity2]);
  });

  it("should download activities", async () => {
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

    const { downloadActivities } = mountHarness(DigitalProductDocumentType.Passport);
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

    const period: PeriodDto = {
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: "2022-01-08T00:00:00.000Z",
    };

    await downloadActivities(id, period);

    expect(mocks.downloadActivities).toHaveBeenCalledWith(id, {
      period,
    });

    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(fakeLink.setAttribute).toHaveBeenCalledWith("download", "activities.zip");
    expect(appendChildSpy).toHaveBeenCalled();
    expect(fakeLink.click).toHaveBeenCalledTimes(1);
    expect(fakeLink.remove).toHaveBeenCalledTimes(1);
  });
});
