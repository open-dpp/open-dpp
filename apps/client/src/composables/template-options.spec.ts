import { DigitalProductDocumentStatusDto } from "@open-dpp/dto";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, ref } from "vue";
import { useTemplateOptions } from "./template-options.ts";

const mocks = vi.hoisted(() => ({
  fetchTemplates: vi.fn(),
  logErrorWithNotification: vi.fn(),
}));

vi.mock("vue-i18n", () => ({ useI18n: () => ({ t: (key: string) => key }) }));
vi.mock("./aas-utils.ts", () => ({
  useAasUtils: () => ({
    parseDisplayNameFromEnvironment: (environment: { name: string }) => environment.name,
  }),
}));
vi.mock("../stores/error.handling.ts", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification: mocks.logErrorWithNotification }),
}));
vi.mock("./templates.ts", async () => {
  const { ref } = await import("vue");
  const templates = ref();
  const loading = ref(false);
  return {
    useTemplates: () => ({
      templates,
      loading,
      fetchTemplates: async (...args: unknown[]) => {
        const response = await mocks.fetchTemplates(...args);
        templates.value = response;
        return response;
      },
    }),
  };
});

function template(id: string, name: string, status = DigitalProductDocumentStatusDto.Draft) {
  return { id, environment: { name }, lastStatusChange: { currentStatus: status } };
}

function page(result: ReturnType<typeof template>[], cursor: string | null) {
  return { paging_metadata: { cursor }, result };
}

describe("useTemplateOptions", () => {
  function mountHarness(isDisabled?: () => boolean) {
    const Harness = defineComponent({
      setup() {
        return { api: useTemplateOptions(isDisabled) };
      },
      template: "<div />",
    });
    return mount(Harness).vm.api as ReturnType<typeof useTemplateOptions>;
  }

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads the first page of draft and published templates on mount", async () => {
    mocks.fetchTemplates.mockResolvedValue(
      page([template("t1", "First"), template("t2", "Second", "Published" as never)], null),
    );
    const { options } = mountHarness();
    await flushPromises();

    expect(mocks.fetchTemplates).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }), {
      status: [DigitalProductDocumentStatusDto.Draft, DigitalProductDocumentStatusDto.Published],
    });
    expect(options.value).toEqual([
      { id: "t1", label: "First", status: "status.draft" },
      { id: "t2", label: "Second", status: "status.published" },
    ]);
  });

  it("falls back to the id for untitled templates", async () => {
    mocks.fetchTemplates.mockResolvedValue(page([template("t1", "common.untitled")], null));
    const { options } = mountHarness();
    await flushPromises();
    expect(options.value[0]?.label).toEqual("t1");
  });

  it("loads the next page when the last option is scrolled into view", async () => {
    // a page only has a successor when it is full (limit 10)
    const fullPage = Array.from({ length: 10 }, (_, i) => template(`t${i}`, `Template ${i}`));
    mocks.fetchTemplates
      .mockResolvedValueOnce(page(fullPage, "cursor-1"))
      .mockResolvedValueOnce(page([template("t2", "Second")], null));
    const { options, onLazyLoad } = mountHarness();
    await flushPromises();
    expect(mocks.fetchTemplates).toHaveBeenCalledTimes(1);
    await onLazyLoad({ last: 3 });
    expect(mocks.fetchTemplates).toHaveBeenCalledTimes(1);

    await onLazyLoad({ last: 9 });
    expect(mocks.fetchTemplates).toHaveBeenCalledTimes(2);
    expect(options.value).toHaveLength(11);
    expect(options.value[10]?.id).toEqual("t2");

    // the last page is reached, nothing more to load
    await onLazyLoad({ last: 10 });
    expect(mocks.fetchTemplates).toHaveBeenCalledTimes(2);
  });

  it("reports a failed load", async () => {
    const error = new Error("boom");
    mocks.fetchTemplates.mockRejectedValue(error);
    const { options } = mountHarness();
    await flushPromises();

    expect(options.value).toEqual([]);
    expect(mocks.logErrorWithNotification).toHaveBeenCalledWith("templates.errorFetchList", error);
  });

  it("provides the props of the select and follows the disabled state", async () => {
    mocks.fetchTemplates.mockResolvedValue(page([template("t1", "First")], null));
    const disabled = ref(false);
    const { selectProps } = mountHarness(() => disabled.value);
    await flushPromises();

    expect(selectProps.value).toMatchObject({
      optionValue: "id",
      optionLabel: "label",
      disabled: false,
      virtualScrollerOptions: { itemSize: 40, lazy: true },
    });
    expect(selectProps.value.options).toHaveLength(1);

    disabled.value = true;
    expect(selectProps.value.disabled).toBe(true);
  });
});
