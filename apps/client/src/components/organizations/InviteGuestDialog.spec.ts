import { GuestRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import InviteGuestDialog from "./InviteGuestDialog.vue";

const mocks = vi.hoisted(() => ({ inviteGuest: vi.fn() }));

vi.mock("../../composables/guest-access.ts", () => ({
  useGuestAccess: () => ({ inviteGuest: mocks.inviteGuest }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

// Dialog renders its content only while it is visible, the other components are plain inputs
const DialogStub = defineComponent({
  props: ["visible"],
  setup(props, { slots }) {
    return () => (props.visible ? h("div", { "data-test": "dialog" }, slots.default?.()) : null);
  },
});
const GuestRoleSelectStub = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h(
        "select",
        {
          "data-test": "role",
          value: props.modelValue,
          onChange: (event: Event) =>
            emit("update:modelValue", (event.target as HTMLSelectElement).value),
        },
        Object.values(GuestRoleDto).map((role) => h("option", { value: role }, role)),
      );
  },
});
const InputTextStub = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit }) {
    return () =>
      h("input", {
        "data-test": "email",
        value: props.modelValue,
        onInput: (event: Event) =>
          emit("update:modelValue", (event.target as HTMLInputElement).value),
      });
  },
});
const ButtonStub = defineComponent({
  props: ["label"],
  setup(props, { attrs }) {
    return () => h("button", { ...attrs, type: attrs.type ?? "button" }, props.label);
  },
});

function mountDialog() {
  return mount(InviteGuestDialog, {
    global: {
      stubs: {
        Dialog: DialogStub,
        Button: ButtonStub,
        InputText: InputTextStub,
        GuestRoleSelect: GuestRoleSelectStub,
        RingLoader: true,
      },
    },
  });
}

async function openDialog() {
  wrapper = mountDialog();
  wrapper.vm.open();
  await nextTick();
}

let wrapper: ReturnType<typeof mountDialog>;

describe("inviteGuestDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows its content only after it was opened", async () => {
    wrapper = mountDialog();
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(false);

    wrapper.vm.open();
    await nextTick();

    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(true);
  });

  it("invites with the entered email and the default role, then confirms and emits success", async () => {
    mocks.inviteGuest.mockResolvedValue(true);
    await openDialog();

    await wrapper.find('[data-test="email"]').setValue("repairer@example.com");
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.emitted("success")).toHaveLength(1));

    expect(mocks.inviteGuest).toHaveBeenCalledWith("repairer@example.com", GuestRoleDto.REPAIRER);
    expect(wrapper.text()).toContain("guestAccess.inviteSuccess");
  });

  it("does not invite with an invalid email", async () => {
    await openDialog();

    await wrapper.find('[data-test="email"]').setValue("no-email");
    await wrapper.find("form").trigger("submit");

    expect(mocks.inviteGuest).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("common.form.email.invalid");
  });

  it("keeps the form open and does not emit success if the invitation fails", async () => {
    mocks.inviteGuest.mockResolvedValue(false);
    await openDialog();

    await wrapper.find('[data-test="email"]').setValue("repairer@example.com");
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(mocks.inviteGuest).toHaveBeenCalled());

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(wrapper.text()).not.toContain("guestAccess.inviteSuccess");
  });

  it("starts with an empty form every time it opens", async () => {
    mocks.inviteGuest.mockResolvedValue(true);
    await openDialog();
    await wrapper.find('[data-test="email"]').setValue("repairer@example.com");
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.text()).toContain("guestAccess.inviteSuccess"));

    wrapper.vm.open();
    await nextTick();

    expect(wrapper.text()).not.toContain("guestAccess.inviteSuccess");
    expect((wrapper.find('[data-test="email"]').element as HTMLInputElement).value).toEqual("");
  });
});
