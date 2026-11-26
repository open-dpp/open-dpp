import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCopyToClipboard } from "./copy-to-clipboard.ts";

const { logErrorWithNotification, addSuccessNotification } = vi.hoisted(() => ({
  logErrorWithNotification: vi.fn(),
  addSuccessNotification: vi.fn(),
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
  const writeText = vi.fn();
  const execCommand = vi.fn();

  function setClipboard(clipboard: { writeText: typeof writeText } | undefined) {
    Object.defineProperty(globalThis.navigator, "clipboard", {
      value: clipboard,
      configurable: true,
    });
  }

  beforeEach(() => {
    vi.resetAllMocks();
    writeText.mockResolvedValue(undefined);
    setClipboard({ writeText });
    Object.defineProperty(globalThis.document, "execCommand", {
      value: execCommand,
      configurable: true,
    });
  });

  it("copies the text and confirms it", async () => {
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(writeText).toHaveBeenCalledWith("some-id");
    expect(addSuccessNotification).toHaveBeenCalledWith("common.clipboardSuccess");
    expect(logErrorWithNotification).not.toHaveBeenCalled();
  });

  it("reports an error instead of success when the clipboard is unavailable", async () => {
    setClipboard(undefined);
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(addSuccessNotification).not.toHaveBeenCalled();
    expect(logErrorWithNotification).toHaveBeenCalledWith(
      "common.clipboardError",
      expect.any(Error),
    );
  });

  it("reports an error when the write is rejected and a fallback would return false", async () => {
    const error = new DOMException("Write permission denied", "NotAllowedError");
    writeText.mockRejectedValue(error);
    execCommand.mockReturnValue(false);
    const { copyToClipboard } = useCopyToClipboard();

    await copyToClipboard("some-id");

    expect(addSuccessNotification).not.toHaveBeenCalled();
    expect(logErrorWithNotification).toHaveBeenCalledWith("common.clipboardError", error);
  });
});
