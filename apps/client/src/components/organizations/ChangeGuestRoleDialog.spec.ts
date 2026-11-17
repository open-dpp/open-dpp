import type { GuestAccessResponseDto } from "@open-dpp/dto";
import { GuestAccessKindDto, GuestAccessStatusDto, GuestRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";
import ChangeGuestRoleDialog from "./ChangeGuestRoleDialog.vue";

const mocks = vi.hoisted(() => ({ changeGuestRole: vi.fn() }));

vi.mock("../../composables/guest-access.ts", () => ({
  useGuestAccess: () => ({ changeGuestRole: mocks.changeGuestRole }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

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
const ButtonStub = defineComponent({
  props: ["label", "disabled"],
  setup(props, { attrs }) {
    return () =>
      h(
        "button",
        { ...attrs, disabled: props.disabled, type: attrs.type ?? "button" },
        props.label,
      );
  },
});

const guestAccess: GuestAccessResponseDto = {
  kind: GuestAccessKindDto.DIRECT,
  id: "access-1",
  organizationId: "org-1",
  email: "repairer@example.com",
  guestRole: GuestRoleDto.REPAIRER,
  grantedBy: "owner-1",
  status: GuestAccessStatusDto.ACCEPTED,
  createdAt: "2026-10-27T10:00:00.000Z",
};

function mountDialog() {
  return mount(ChangeGuestRoleDialog, {
    global: {
      stubs: { Dialog: DialogStub, Button: ButtonStub, GuestRoleSelect: GuestRoleSelectStub },
    },
  });
}

let wrapper: ReturnType<typeof mountDialog>;

async function openDialog(access: GuestAccessResponseDto = guestAccess) {
  wrapper = mountDialog();
  wrapper.vm.open(access);
  await nextTick();
}

describe("changeGuestRoleDialog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("shows its content only after it was opened for a guest", async () => {
    wrapper = mountDialog();
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(false);

    wrapper.vm.open(guestAccess);
    await nextTick();

    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(true);
  });

  it("shows the guest and cannot save the unchanged role", async () => {
    await openDialog();

    expect(wrapper.text()).toContain("repairer@example.com");
    expect(wrapper.find('button[type="submit"]').attributes("disabled")).toBeDefined();
  });

  it("changes the role, closes itself and emits success", async () => {
    mocks.changeGuestRole.mockResolvedValue(true);
    await openDialog();

    await wrapper.find('[data-test="role"]').setValue(GuestRoleDto.SUPPLIER);
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(wrapper.emitted("success")).toHaveLength(1));

    expect(mocks.changeGuestRole).toHaveBeenCalledWith("access-1", GuestRoleDto.SUPPLIER);
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(false);
  });

  it("stays open and does not emit success if the change fails", async () => {
    mocks.changeGuestRole.mockResolvedValue(false);
    await openDialog();

    await wrapper.find('[data-test="role"]').setValue(GuestRoleDto.SUPPLIER);
    await wrapper.find("form").trigger("submit");
    await vi.waitFor(() => expect(mocks.changeGuestRole).toHaveBeenCalled());

    expect(wrapper.emitted("success")).toBeUndefined();
    expect(wrapper.find('[data-test="dialog"]').exists()).toBe(true);
  });

  it("starts with the current role every time it opens", async () => {
    await openDialog();
    await wrapper.find('[data-test="role"]').setValue(GuestRoleDto.SUPPLIER);

    wrapper.vm.open(guestAccess);
    await nextTick();

    expect((wrapper.find('[data-test="role"]').element as HTMLSelectElement).value).toEqual(
      GuestRoleDto.REPAIRER,
    );
  });

  it("follows the guest it is opened for", async () => {
    await openDialog({
      ...guestAccess,
      email: "other@example.com",
      guestRole: GuestRoleDto.RECYCLER,
    });

    expect(wrapper.text()).toContain("other@example.com");
    expect((wrapper.find('[data-test="role"]').element as HTMLSelectElement).value).toEqual(
      GuestRoleDto.RECYCLER,
    );
  });
});
