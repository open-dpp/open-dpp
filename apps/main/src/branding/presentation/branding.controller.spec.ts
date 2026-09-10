import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { BrandingController } from "./branding.controller";

function makeRes() {
  const res: Record<string, unknown> = { headersSent: false };
  res.setHeader = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.destroy = jest.fn();
  return res as never;
}

function make(opts: { media?: unknown; isOwnLogo?: boolean } = {}) {
  const brandingRepository = {
    isOrganizationLogo: jest.fn<any>(async () => opts.isOwnLogo ?? false),
  };
  const mediaService = {
    findOneOrFail: jest.fn<any>(
      async () =>
        opts.media ?? { id: "m-1", ownedByOrganizationId: "org-1", mimeType: "image/png" },
    ),
    getFilestreamOfMedia: jest.fn<any>(async () => ({ pipe: jest.fn(), on: jest.fn() })),
  };
  const controller = new BrandingController(brandingRepository as never, mediaService as never);
  return { controller, brandingRepository, mediaService };
}

describe("BrandingController.getOrganizationLogo (public, ownership-gated)", () => {
  it("streams the media when it is its owning org's branding logo", async () => {
    const { controller, brandingRepository, mediaService } = make({
      media: { id: "m-1", ownedByOrganizationId: "org-1", mimeType: "image/png" },
      isOwnLogo: true,
    });
    const res = makeRes();

    await controller.getOrganizationLogo("m-1", res);

    // gate checks ownership: mediaId + the media's OWN org
    expect(brandingRepository.isOrganizationLogo).toHaveBeenCalledWith("m-1", "org-1");
    expect(mediaService.getFilestreamOfMedia).toHaveBeenCalled();
    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalledWith(404);
  });

  it("404s when the media is not its owning org's logo (blocks cross-org / arbitrary by-id access)", async () => {
    const { controller, mediaService } = make({
      media: { id: "m-1", ownedByOrganizationId: "org-1", mimeType: "image/png" },
      isOwnLogo: false,
    });
    const res = makeRes();

    await controller.getOrganizationLogo("m-1", res);

    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("404s when the designated logo media is not an image (no passport-file exposure)", async () => {
    const { controller, mediaService } = make({
      media: { id: "m-1", ownedByOrganizationId: "org-1", mimeType: "application/pdf" },
      isOwnLogo: true,
    });
    const res = makeRes();

    await controller.getOrganizationLogo("m-1", res);

    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("404s when the media does not exist", async () => {
    const { controller, mediaService } = make();
    mediaService.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException("Media"));
    const res = makeRes();

    await controller.getOrganizationLogo("missing", res);

    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
  });

  it("rethrows database failures from the media lookup instead of masking them as 404", async () => {
    const { controller, mediaService } = make();
    mediaService.findOneOrFail.mockRejectedValue(new Error("MongoNetworkError: connection lost"));
    const res = makeRes();

    await expect(controller.getOrganizationLogo("m-1", res)).rejects.toThrow("connection lost");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
  });

  it("rethrows database failures from the logo ownership check instead of masking them as 404", async () => {
    const { controller, brandingRepository } = make();
    brandingRepository.isOrganizationLogo.mockRejectedValue(new Error("MongoServerError: timeout"));
    const res = makeRes();

    await expect(controller.getOrganizationLogo("m-1", res)).rejects.toThrow("timeout");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
  });

  it("rethrows object-store failures when fetching the logo stream instead of masking them as 404", async () => {
    const { controller, mediaService } = make({ isOwnLogo: true });
    mediaService.getFilestreamOfMedia.mockRejectedValue(new Error("Bucket does not exist"));
    const res = makeRes();

    await expect(controller.getOrganizationLogo("m-1", res)).rejects.toThrow(
      "Bucket does not exist",
    );

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
  });
});
