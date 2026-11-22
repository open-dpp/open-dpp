import type { LegalLinksDto } from "@open-dpp/dto";
import type { VueWrapper } from "@vue/test-utils";
import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent } from "vue";
import { createI18n } from "vue-i18n";
import enUS from "../../translations/en-US.json";

const { useInstanceSettingsStore } = vi.hoisted(() => ({
  useInstanceSettingsStore: vi.fn(),
}));

vi.mock("../../stores/instance-settings.ts", () => ({ useInstanceSettingsStore }));
vi.mock("../../auth-client.ts", () => ({
  authClient: { signUp: { email: vi.fn() } },
}));
vi.mock("../../lib/api-client.ts", () => ({
  default: { dpp: { oauthProvider: {} } },
}));
vi.mock("../../components/media/BrandingLogo.vue", () => ({
  default: defineComponent({ name: "BrandingLogo", template: "<div />" }),
}));
vi.mock("vue-router", () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("primevue/usetoast", () => ({
  useToast: () => ({ add: vi.fn() }),
}));

import Signup from "./Signup.vue";

const CardStub = defineComponent({
  name: "Card",
  template: `<div><slot name="header" /><slot name="title" /><slot name="content" /><slot name="footer" /></div>`,
});

const InputTextStub = defineComponent({
  name: "InputText",
  props: ["modelValue", "invalid"],
  template: `<input />`,
});

const PasswordStub = defineComponent({
  name: "Password",
  inheritAttrs: false,
  props: ["modelValue", "inputId"],
  template: `<input :id="inputId" type="password" />`,
});

const CheckboxStub = defineComponent({
  name: "Checkbox",
  inheritAttrs: false,
  props: ["modelValue", "inputId"],
  template: `<input :id="inputId" type="checkbox" />`,
});

const ButtonStub = defineComponent({
  name: "Button",
  props: ["label", "loading"],
  template: `<button>{{ label }}</button>`,
});

const SlotStub = (name: string) => defineComponent({ name, template: `<div><slot /></div>` });

const i18n = createI18n({
  locale: "en-US",
  legacy: false,
  messages: { "en-US": enUS },
});

function mountSignup(legalLinks: LegalLinksDto) {
  useInstanceSettingsStore.mockReturnValue({
    settings: { signupEnabled: true, legalLinks },
    signupEnabled: true,
    legalLinks,
    consentRequired: Object.keys(legalLinks).length > 0,
    fetchPublicSettings: vi.fn().mockResolvedValue(undefined),
  });
  return mount(Signup, {
    global: {
      plugins: [i18n],
      stubs: {
        Card: CardStub,
        InputText: InputTextStub,
        Password: PasswordStub,
        Checkbox: CheckboxStub,
        Button: ButtonStub,
        Message: SlotStub("Message"),
        RouterLink: SlotStub("RouterLink"),
      },
    },
  });
}

/** The controls of the form from top to bottom: the id of a field, `submit` for the button. */
function controlOrder(wrapper: VueWrapper): string[] {
  return wrapper
    .findAll("form input, form button")
    .map((control) => control.attributes("id") ?? control.attributes("type") ?? "");
}

describe("Signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("asks for consent after both password fields, right above the submit button", async () => {
    const wrapper = mountSignup({
      termsOfServiceUrl: "https://example.com/terms",
      privacyPolicyUrl: "https://example.com/privacy",
    });
    await flushPromises();

    expect(controlOrder(wrapper)).toEqual([
      "firstName",
      "lastName",
      "email",
      "password",
      "passwordRepeat",
      "termsAccepted",
      "submit",
    ]);
  });

  it("shows no consent checkbox while the instance links no legal documents", async () => {
    const wrapper = mountSignup({});
    await flushPromises();

    expect(controlOrder(wrapper)).toEqual([
      "firstName",
      "lastName",
      "email",
      "password",
      "passwordRepeat",
      "submit",
    ]);
  });
});
