import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import TemplateSelectOption from "./TemplateSelectOption.vue";

const i18n = createI18n({
  locale: "en",
  legacy: false,
  messages: {
    en: {
      filter: { status: "Status" },
      common: { id: "ID", name: "Name" },
      notifications: { info: "Information" },
    },
  },
});

describe("templateSelectOption", () => {
  const option = { id: "template-1", label: "A very long template name", status: "Draft" };

  function mountOption() {
    const show = vi.fn();
    const hide = vi.fn();
    // The real Popover needs the PrimeVue plugin and renders its content only while visible.
    const PopoverStub = defineComponent({
      name: "Popover",
      setup(_, { expose }) {
        expose({ show, hide });
      },
      template: "<div data-test='popover'><slot /></div>",
    });
    const wrapper = mount(TemplateSelectOption, {
      props: { option },
      global: {
        plugins: [i18n],
        stubs: {
          Tag: { props: ["value"], template: "<span data-test='tag'>{{ value }}</span>" },
          Popover: PopoverStub,
        },
      },
    });
    return { wrapper, show, hide };
  }

  it("shows the beginning of the name, an info icon and the status in the row", () => {
    const { wrapper } = mountOption();
    const name = wrapper.get("span.truncate");
    expect(name.text()).toBe("A very long template name");
    expect(wrapper.get("[data-test='tag']").text()).toBe("Draft");
    expect(wrapper.get("[data-cy='template-select-option-info']").attributes("aria-label")).toBe(
      "Information",
    );
  });

  it("describes the template with name, status and id in a definition list", () => {
    const { wrapper } = mountOption();
    const popover = wrapper.get("[data-test='popover']");
    expect(popover.findAll("dt").map((dt) => dt.text())).toEqual(["Name", "Status", "ID"]);
    expect(popover.findAll("dd").map((dd) => dd.text())).toEqual([
      "A very long template name",
      "Draft",
      "template-1",
    ]);
  });

  it("opens the popover when hovering the info icon and closes it when the pointer leaves", async () => {
    const { wrapper, show, hide } = mountOption();
    const icon = wrapper.get("[data-cy='template-select-option-info']");

    await icon.trigger("mouseenter");
    expect(show).toHaveBeenCalledOnce();
    expect(show.mock.calls[0]?.[0]).toBeInstanceOf(Event);
    expect(hide).not.toHaveBeenCalled();

    await icon.trigger("mouseleave");
    expect(hide).toHaveBeenCalledOnce();
  });

  it("does not open the popover when hovering the rest of the row", async () => {
    const { wrapper, show } = mountOption();
    await wrapper.get("[data-cy='template-select-option']").trigger("mouseenter");
    await wrapper.get("span.truncate").trigger("mouseenter");
    expect(show).not.toHaveBeenCalled();
  });
});
