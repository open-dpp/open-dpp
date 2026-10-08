import { mount } from '@vue/test-utils';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import { useRegistryExport } from './registry-export.ts';

const mocks = vi.hoisted(() => ({
  exportToRegistry: vi.fn(),
  addSuccessNotification: vi.fn(),
  logErrorWithNotification: vi.fn(),
}));

vi.mock("../stores/notification.ts", () => ({
  useNotificationStore: () => ({ addSuccessNotification: mocks.addSuccessNotification }),
}));

vi.mock("../stores/error.handling.ts", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: mocks.logErrorWithNotification }),
}));

vi.mock("../lib/api-client", () => ({
  default: { dpp: { passports: { exportToRegistry: mocks.exportToRegistry } } },
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function mountHarness() {
  const Harness = defineComponent({
    setup() {
      return { api: useRegistryExport() };
    },
    template: "<div />",
  });
  return mount(Harness).vm.api as ReturnType<typeof useRegistryExport>;
}

function axiosErrorWithStatus(status: number) {
  const error = new AxiosError("failed");
  error.response = { status } as AxiosError["response"];
  return error;
}

describe("useRegistryExport", () => {
  const createObjectURL = vi.fn(() => "blob:zip");
  const revokeObjectURL = vi.fn();
  let clickedLinks: HTMLAnchorElement[];

  beforeEach(() => {
    vi.resetAllMocks();
    createObjectURL.mockReturnValue("blob:zip");
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    clickedLinks = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        clickedLinks.push(this);
      },
    );
  });

  it("sends the filter and downloads the ZIP", async () => {
    mocks.exportToRegistry.mockResolvedValue({ status: 200, data: new Blob(["zip"]) });
    const { exportToRegistry, exporting } = mountHarness();

    const result = await exportToRegistry({
      templateIds: ["t1"],
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-02-01T23:59:59.999Z",
    });

    expect(result).toBe(true);
    expect(mocks.exportToRegistry).toHaveBeenCalledWith({
      templateIds: ["t1"],
      startDate: "2026-01-01T00:00:00.000Z",
      endDate: "2026-02-01T23:59:59.999Z",
    });
    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0].getAttribute("download")).toMatch(
      /^eu-registry-export-\d{4}-\d{2}-\d{2}\.zip$/,
    );
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:zip");
    expect(exporting.value).toBe(false);
    expect(mocks.addSuccessNotification).toHaveBeenCalledWith(
      "passports.registryExport.success",
      undefined,
      expect.any(Number),
    );
    expect(mocks.logErrorWithNotification).not.toHaveBeenCalled();
  });

  it("shows a specific message if no passport matches", async () => {
    mocks.exportToRegistry.mockRejectedValue(axiosErrorWithStatus(404));
    const { exportToRegistry } = mountHarness();

    expect(await exportToRegistry({})).toBe(false);

    expect(mocks.logErrorWithNotification).toHaveBeenCalledWith(
      "passports.registryExport.noMatch",
      expect.any(AxiosError),
    );
    expect(mocks.addSuccessNotification).not.toHaveBeenCalled();
    expect(clickedLinks).toHaveLength(0);
  });

  it("shows a generic message for other errors", async () => {
    mocks.exportToRegistry.mockRejectedValueOnce(axiosErrorWithStatus(500));
    const { exportToRegistry } = mountHarness();

    expect(await exportToRegistry({})).toBe(false);

    expect(mocks.logErrorWithNotification).toHaveBeenCalledWith(
      "passports.registryExport.error",
      expect.any(AxiosError),
    );
  });
});
