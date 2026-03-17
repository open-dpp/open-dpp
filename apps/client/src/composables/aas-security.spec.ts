import type { useAasEditor } from "./aas-editor.ts";

import type { AasSecurityProps } from "./aas-security.ts";
import { Permissions } from "@open-dpp/dto";
import { accessPermissionRulePlainFactory } from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import apiClient from "../lib/api-client.ts";
import { HTTPCode } from "../stores/http-codes.ts";
import { useAasSecurity } from "./aas-security.ts";

const mocks = vi.hoisted(() => {
  return {
    getSecurity: vi.fn(),
  };
});

vi.mock("../lib/api-client", () => ({
  default: {
    setActiveOrganizationId: vi.fn(),
    dpp: {
      templates: {
        aas: {
          getSecurity: mocks.getSecurity,
        },
      },
    },
  },
}));

const { fetchMediaMock } = vi.hoisted(() => ({
  fetchMediaMock:
    vi.fn<
      (
        mediaId: string,
      ) => Promise<{ blob: Blob | null; mediaInfo: { id: string } }>
    >(),
}));

vi.mock("../stores/media.ts", () => ({
  useMediaStore: () => ({
    fetchMedia: fetchMediaMock,
  }),
}));

describe("aasEditor composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness(aasSecurityProps: AasSecurityProps) {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasSecurity(aasSecurityProps);
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasEditor>),
    };
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => {
      w.unmount();
    });
  });
  const aasWrapperId = "aasId";

  it("should return displayName", async () => {
    const security = [accessPermissionRulePlainFactory.build()];
    mocks.getSecurity.mockResolvedValue({
      data: security,
      status: HTTPCode.OK,
    });

    const { init, can } = mountHarness({
      id: aasWrapperId,
      aasNamespace: apiClient.dpp.templates.aas,
    });
    await init();
    expect(can({ action: Permissions.Read, object: AasResource }));
    expect(displayName.value).toEqual("My AAS");
  });
});
