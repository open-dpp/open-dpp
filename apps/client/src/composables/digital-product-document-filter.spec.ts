import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { useDigitalProductDocumentFilter } from "./digital-product-document-filter.ts";
import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  routerPush: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRoute: () => ({ query: mocks.query }),
  useRouter: () => ({
    push: mocks.routerPush,
  }),
}));

describe("useDppFilter", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useDigitalProductDocumentFilter();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useDigitalProductDocumentFilter>),
    };
  }

  beforeEach(() => {
    // Create a fresh pinia instance and make it active
    setActivePinia(createPinia());

    vi.resetAllMocks();
  });

  afterEach(() => {
    mountedWrappers.splice(0).forEach((w) => {
      w.unmount();
    });
  });

  it("should change status", async () => {
    mocks.query.mockReturnValue({ status: DigitalProductDocumentStatusDto.Draft });
    const { status, changeStatus } = mountHarness();
    expect(status.value).toEqual(DigitalProductDocumentStatusDto.Draft);
    await changeStatus(DigitalProductDocumentStatusDto.Published);
    expect(mocks.routerPush).toHaveBeenCalledWith({
      query: expect.objectContaining({ status: DigitalProductDocumentStatusDto.Published }),
    });
    expect(status.value).toEqual(DigitalProductDocumentStatusDto.Published);
  });
});
