import type { VueWrapper } from "@vue/test-utils";
import { MEDIA_UPLOAD_MAX_SIZE_BYTES, MEDIA_UPLOAD_MIME_TYPES } from "@open-dpp/dto";
import { flushPromises, mount } from "@vue/test-utils";
import { AxiosError, AxiosHeaders } from "axios";
import { createPinia, setActivePinia } from "pinia";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h } from "vue";
import { createI18n } from "vue-i18n";
import MediaModal from "../components/media/MediaModal.vue";
import { useMediaStore } from "../stores/media";
import { NotificationType, useNotificationStore } from "../stores/notification";
import deDE from "../translations/de-DE.json";
import enUS from "../translations/en-US.json";
import MediaView from "../view/media/MediaView.vue";

const mocks = vi.hoisted(() => ({
  uploadGeneralMedia: vi.fn(),
  getMediaInfo: vi.fn(),
  getMediaInfoByOrganization: vi.fn(),
}));

vi.mock("../lib/api-client", () => ({
  default: { media: { media: mocks } },
}));

const LOCALES = ["en-US", "de-DE"] as const;
const MAX_SIZE_MB = MEDIA_UPLOAD_MAX_SIZE_BYTES / 1024 / 1024;

// PrimeVue's FileUpload opens the OS file dialog, which jsdom cannot drive. The stub keeps
// the two things the entry points control: the `accept` list and the `select` handler.
const FileUploadStub = defineComponent({
  name: "FileUpload",
  props: ["accept"],
  emits: ["select"],
  setup: () => () => h("button", { "data-test": "upload" }),
});

// The upload button of the picker sits in the dialog header
const DialogStub = defineComponent({
  props: ["visible"],
  setup(props, { slots }) {
    return () =>
      props.visible ? h("div", [slots.header?.(), slots.default?.(), slots.footer?.()]) : null;
  },
});

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: "en-US",
    messages: { "en-US": enUS, "de-DE": deDE },
  });
}

let i18n: ReturnType<typeof createTestI18n>;
let pinia: ReturnType<typeof createPinia>;

function mountOptions() {
  return {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        FileUpload: FileUploadStub,
        Dialog: DialogStub,
        Button: true,
        MediaGrid: true,
        MediaDetailsSidebar: true,
      },
    },
  };
}

const entryPoints: { name: string; mountEntryPoint: () => VueWrapper }[] = [
  { name: "media library", mountEntryPoint: () => mount(MediaView, mountOptions()) },
  {
    name: "media picker dialog",
    mountEntryPoint: () => mount(MediaModal, { ...mountOptions(), props: { modelValue: true } }),
  },
];

function apiError(status: number, data: unknown = {}): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError(`Request failed with status code ${status}`, undefined, config, null, {
    status,
    statusText: "",
    data,
    headers: {},
    config,
  });
}

async function selectFile(wrapper: VueWrapper, files: File[]) {
  wrapper.findComponent(FileUploadStub).vm.$emit("select", { files });
  await flushPromises();
}

function shownMessages(type: NotificationType): string[] {
  return useNotificationStore()
    .notifications.filter((notification) => notification.type === type)
    .map((notification) => notification.message);
}

describe.each(entryPoints)("uploading in the $name", ({ mountEntryPoint }) => {
  const svg = new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "logo.svg", {
    type: "image/svg+xml",
  });

  const uploaded = { id: "media-id", title: "logo.svg", mimeType: "image/svg+xml", size: 42 };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.getMediaInfoByOrganization.mockResolvedValue({ data: [] });
    mocks.getMediaInfo.mockResolvedValue({ data: uploaded });
    // the error handling store logs every failed upload
    vi.spyOn(console, "error").mockImplementation(() => {});
    pinia = createPinia();
    setActivePinia(pinia);
    i18n = createTestI18n();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("offers exactly the shared allowlist in the file dialog", () => {
    const wrapper = mountEntryPoint();

    expect(wrapper.findComponent(FileUploadStub).props("accept")).toBe(
      MEDIA_UPLOAD_MIME_TYPES.join(","),
    );
  });

  it.each(LOCALES)("confirms an upload in %s", async (locale) => {
    i18n.global.locale.value = locale;
    mocks.uploadGeneralMedia.mockResolvedValue(uploaded.id);
    const wrapper = mountEntryPoint();

    await selectFile(wrapper, [svg]);

    expect(mocks.uploadGeneralMedia.mock.calls.map(([file]) => file)).toEqual([svg]);
    expect(shownMessages(NotificationType.SUCCESS)).toEqual([i18n.global.t("file.uploadSuccess")]);
    expect(shownMessages(NotificationType.ERROR)).toEqual([]);
  });

  it("adds the uploaded file to the loaded media without loading the others again", async () => {
    const alreadyLoaded = { id: "older-id", title: "older.png", mimeType: "image/png", size: 7 };
    const mediaStore = useMediaStore();
    mediaStore.organizationMedia = [alreadyLoaded];
    mocks.uploadGeneralMedia.mockResolvedValue(uploaded.id);
    const wrapper = mountEntryPoint();

    await selectFile(wrapper, [svg]);

    expect(mediaStore.organizationMedia).toEqual([alreadyLoaded, uploaded]);
    expect(mocks.getMediaInfo.mock.calls).toEqual([[uploaded.id]]);
    expect(mocks.getMediaInfoByOrganization).not.toHaveBeenCalled();
  });

  it.each(LOCALES)(
    "says in %s that the file is unsupported or invalid when the upload answers 400",
    async (locale) => {
      i18n.global.locale.value = locale;
      mocks.uploadGeneralMedia.mockRejectedValue(apiError(400));
      const wrapper = mountEntryPoint();

      await selectFile(wrapper, [svg]);

      expect(i18n.global.te("file.uploadInvalid", locale)).toBe(true);
      expect(shownMessages(NotificationType.ERROR)).toEqual([
        i18n.global.t("file.uploadInvalid", { maxSizeMb: MAX_SIZE_MB }),
      ]);
      expect(shownMessages(NotificationType.SUCCESS)).toEqual([]);
    },
  );

  it.each(LOCALES)("shows the generic upload error in %s for any other failure", async (locale) => {
    i18n.global.locale.value = locale;
    mocks.uploadGeneralMedia.mockRejectedValue(apiError(500));
    const wrapper = mountEntryPoint();

    await selectFile(wrapper, [svg]);

    expect(shownMessages(NotificationType.ERROR)).toEqual([i18n.global.t("file.uploadError")]);
  });

  it("shows the quota message when the storage limit is reached", async () => {
    mocks.uploadGeneralMedia.mockRejectedValue(
      apiError(429, { key: "MEDIA_STORAGE_LIMIT", limit: 100, used: 100 }),
    );
    const wrapper = mountEntryPoint();

    await selectFile(wrapper, [svg]);

    expect(shownMessages(NotificationType.ERROR)).toEqual([
      i18n.global.t("api.error.limit.MEDIA_STORAGE_LIMIT", { limit: 100 }),
    ]);
  });

  it("uploads nothing when the selection is empty", async () => {
    const wrapper = mountEntryPoint();

    await selectFile(wrapper, []);

    expect(mocks.uploadGeneralMedia).not.toHaveBeenCalled();
    expect(useNotificationStore().notifications).toEqual([]);
  });
});
