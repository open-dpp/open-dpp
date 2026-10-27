import { GuestRoleDto, MemberRoleDto, UserRoleDto } from "@open-dpp/dto";
import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import RoleHeader from "./RoleHeader.vue";

vi.mock("vue-i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

function mountRoleHeader(props: InstanceType<typeof RoleHeader>["$props"]) {
  return mount(RoleHeader, {
    props,
    global: { stubs: { DescriptionTerm: { template: "<div><slot /></div>" } } },
  });
}

describe("roleHeader", () => {
  it("names the member role of a policy change", () => {
    const wrapper = mountRoleHeader({
      userRole: UserRoleDto.USER,
      memberRole: MemberRoleDto.MEMBER,
    });

    expect(wrapper.text()).toEqual("organizations.member");
  });

  it("names the guest role of a policy change", () => {
    const wrapper = mountRoleHeader({
      userRole: UserRoleDto.USER,
      memberRole: null,
      guestRole: GuestRoleDto.MARKET_SURVEILLANCE,
    });

    expect(wrapper.text()).toEqual("user.guestRoles.MarketSurveillance");
  });

  it("reads changes recorded before guest roles existed", () => {
    const wrapper = mountRoleHeader({ userRole: UserRoleDto.ANONYMOUS, memberRole: null });

    expect(wrapper.text()).toEqual("user.public");
  });
});
