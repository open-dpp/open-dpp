import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PrimeVue from "primevue/config";
import Button from "primevue/button";
import Column from "primevue/column";
import DataTable from "primevue/datatable";
import { MemberRoleDto } from "@open-dpp/dto";
import OrganizationMembersList from "./OrganizationMembersList.vue";
import { useUserStore } from "../../stores/user.ts";

const mocks = vi.hoisted(() => ({
  removeMember: vi.fn(),
  confirmRequire: vi.fn(),
  listInvitations: vi.fn(),
  cancelInvitation: vi.fn(),
}));

vi.mock("../../auth-client.ts", () => ({
  authClient: {
    organization: {
      listInvitations: mocks.listInvitations,
      cancelInvitation: mocks.cancelInvitation,
    },
  },
}));

vi.mock("../../composables/organizations.ts", () => ({
  useOrganizations: () => ({ removeMember: mocks.removeMember }),
}));

vi.mock("primevue/useconfirm", () => ({
  useConfirm: () => ({ require: mocks.confirmRequire }),
}));

vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const ORG_ID = "org-1";
const REMOVE_LABEL = "organizations.removeMemberDialog.remove";

function member(overrides: Record<string, unknown>) {
  return {
    id: "m-1",
    organizationId: ORG_ID,
    userId: "u-1",
    role: MemberRoleDto.MEMBER,
    createdAt: new Date().toISOString(),
    user: { id: "u-1", email: "member@example.com", name: "Member", image: null },
    ...overrides,
  };
}

const selfOwner = member({
  id: "m-self",
  userId: "u-self",
  role: MemberRoleDto.OWNER,
  user: { id: "u-self", email: "self@example.com", name: "Self", image: null },
});
const plainMember = member({ id: "m-other", userId: "u-other" });
const otherOwner = member({
  id: "m-owner2",
  userId: "u-owner2",
  role: MemberRoleDto.OWNER,
});

describe("OrganizationMembersList", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.resetAllMocks();
    mocks.listInvitations.mockResolvedValue({ data: [] });
  });

  function mountList() {
    return mount(OrganizationMembersList, {
      props: {
        organizationId: ORG_ID,
        members: [selfOwner, plainMember, otherOwner] as never,
      },
      global: {
        plugins: [PrimeVue],
        components: { DataTable, Column, Button },
        stubs: { ChangeMemberRoleDialog: true, InviteMemberDialog: true },
      },
    });
  }

  function removeButtons(wrapper: ReturnType<typeof mountList>) {
    return wrapper.findAll("button").filter((b) => b.text() === REMOVE_LABEL);
  }

  it("shows the remove button only for non-owner members other than the viewer", async () => {
    const userStore = useUserStore();
    userStore.user.id = "u-self";
    userStore.memberRole = MemberRoleDto.OWNER;

    const wrapper = mountList();
    await vi.waitFor(() => expect(mocks.listInvitations).toHaveBeenCalled());

    expect(removeButtons(wrapper)).toHaveLength(1);
  });

  it("shows no remove button for non-owner viewers", async () => {
    const userStore = useUserStore();
    userStore.user.id = "u-other";
    userStore.memberRole = MemberRoleDto.MEMBER;

    const wrapper = mountList();
    await vi.waitFor(() => expect(mocks.listInvitations).toHaveBeenCalled());

    expect(removeButtons(wrapper)).toHaveLength(0);
  });

  it("removes the member after confirmation and emits refresh", async () => {
    const userStore = useUserStore();
    userStore.user.id = "u-self";
    userStore.memberRole = MemberRoleDto.OWNER;
    mocks.removeMember.mockResolvedValueOnce(true);

    const wrapper = mountList();
    await vi.waitFor(() => expect(mocks.listInvitations).toHaveBeenCalled());

    await removeButtons(wrapper)[0]!.trigger("click");
    expect(mocks.confirmRequire).toHaveBeenCalledOnce();

    const confirmOptions = mocks.confirmRequire.mock.calls[0]![0] as {
      accept: () => Promise<void>;
    };
    await confirmOptions.accept();

    expect(mocks.removeMember).toHaveBeenCalledWith("m-other");
    expect(wrapper.emitted("refresh")).toBeTruthy();
  });
});
