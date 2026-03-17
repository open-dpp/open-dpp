import type { SecurityPlainTransientParams } from "@open-dpp/testing";
import {
  MemberRoleDto,
  PermissionKind,
  Permissions,
  SecurityDtoSchema,
} from "@open-dpp/dto";
import {
  securityPlainFactory,
} from "@open-dpp/testing";
import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { defineComponent } from "vue";
import { useAasSecurity } from "./aas-security.ts";

describe("aasSecurity composable", () => {
  const mountedWrappers: Array<ReturnType<typeof mount>> = [];

  function mountHarness() {
    const Harness = defineComponent({
      name: "MediaFileCollectionHarness",
      setup() {
        const api = useAasSecurity();
        return { api };
      },
      template: "<div />",
    });

    const wrapper = mount(Harness);
    mountedWrappers.push(wrapper);
    return {
      wrapper,
      ...(wrapper.vm.api as ReturnType<typeof useAasSecurity>),
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

  it("should", async () => {
    const transientParams: SecurityPlainTransientParams = {
      policies: [
        {
          subject: { role: MemberRoleDto.MEMBER },
          object: { idShortPath: "section1" },
          permissions: [
            {
              permission: Permissions.Create,
              kindOfPermission: PermissionKind.Allow,
            },
          ],
        },
      ],
    };
    const security = securityPlainFactory.build(undefined, { transient: transientParams });
    SecurityDtoSchema.parse(security);

    const { setAasSecurity } = mountHarness();
  });
});
