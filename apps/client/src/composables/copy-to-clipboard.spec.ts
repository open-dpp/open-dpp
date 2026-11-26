import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useCopyToClipboard } from "./copy-to-clipboard.ts";

const { copy, clipboard, logErrorWithNotification, addSuccessNotification } = vi.hoisted(() => ({
  copy: vi.fn(),
  clipboard: { supported: true },
  logErrorWithNotification: vi.fn(),
  addSuccessNotification: vi.fn(),
}));

vi.mock("@vueuse/core", () => ({
  useClipboard: () => ({ copy, isSupported: ref(clipboard.supported) }),
}));
vi.mock("../stores/error.handling", () => ({
  useErrorHandlingStore: () => ({ logErrorWithNotification }),
}));
vi.mock("../stores/notification", () => ({
  useNotificationStore: () => ({ addSuccessNotification }),
}));
vi.mock("vue-i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    copy.mockResolvedValue(undefined);
    clipboard.supported = true;
  });

  it("copies the text and confirms it", async () => {
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(copy).toHaveBeenCalledWith("some-id");
    expect(addSuccessNotification).toHaveBeenCalledWith("common.clipboardSuccess");
    expect(logErrorWithNotification).not.toHaveBeenCalled();
  });

  // useClipboard resolves without copying anything in this case
  it("reports an error instead of success when the clipboard is unsupported", async () => {
    clipboard.supported = false;
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(copy).not.toHaveBeenCalled();
    expect(addSuccessNotification).not.toHaveBeenCalled();
    expect(logErrorWithNotification).toHaveBeenCalledWith(
      "common.clipboardError",
      expect.any(Error),
    );
  });

  it("reports an error instead of success when copying throws", async () => {
    const error = new Error("copy failed");
    copy.mockRejectedValue(error);
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(addSuccessNotification).not.toHaveBeenCalled();
    expect(logErrorWithNotification).toHaveBeenCalledWith("common.clipboardError", error);
  });
});
