import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadZip } from "./zip.ts";

describe("downloadZip", () => {
  const createObjectURL = vi.fn();
  const revokeObjectURL = vi.fn();
  let clickedLinks: HTMLAnchorElement[];

  beforeEach(() => {
    vi.resetAllMocks();
    createObjectURL.mockReturnValue("blob:zip");
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;
    clickedLinks = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function (this: HTMLAnchorElement) {
        clickedLinks.push(this);
      },
    );
  });

  it("downloads the blob as file with the given name and cleans up", () => {

    downloadZip(new Blob(["zip"]), "export.zip");

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickedLinks).toHaveLength(1);
    expect(clickedLinks[0].getAttribute("download")).toBe("export.zip");
    expect(clickedLinks[0].href).toBe("blob:zip");
    expect(document.body.contains(clickedLinks[0])).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:zip");
  });

  it("revokes the URL even if the download fails", () => {
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => downloadZip(new Blob(["zip"]), "export.zip")).toThrow("blocked");

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:zip");
  });
});
