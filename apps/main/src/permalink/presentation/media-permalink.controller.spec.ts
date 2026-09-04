import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { File } from "../../aas/domain/submodel-base/file";
import { MediaPermalinkController } from "./media-permalink.controller";

function makePassport(submodelIds: string[], shellIds: string[] = []) {
  return {
    getEnvironment: () => ({ submodels: submodelIds, assetAdministrationShells: shellIds }),
  };
}

function submodelReferencing(mediaId: string) {
  const file = File.create({ idShort: "doc", contentType: "application/pdf", value: mediaId });
  return { getSubmodelElements: () => [file] };
}

function shellWithThumbnail(mediaId: string) {
  return {
    assetInformation: { defaultThumbnails: [{ path: mediaId, contentType: "image/webp" }] },
  };
}

function makeRes() {
  const res: Record<string, unknown> = { headersSent: false };
  res.setHeader = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res as never;
}

function make(
  opts: {
    passport?: unknown;
    submodels?: Map<string, unknown>;
    shells?: Map<string, unknown>;
  } = {},
) {
  const permalinkApplicationService = {
    resolveToPassport: jest.fn<any>(async () => ({ passport: opts.passport ?? makePassport([]) })),
  };
  const mediaService = {
    findOneOrFail: jest.fn<any>(async () => ({ id: "m-1" })),
    getFilestreamById: jest.fn<any>(),
  };
  const submodelRepository = {
    findByIds: jest.fn<any>(async () => opts.submodels ?? new Map()),
  };
  const aasRepository = {
    findByIds: jest.fn<any>(async () => opts.shells ?? new Map()),
  };
  const controller = new MediaPermalinkController(
    permalinkApplicationService as never,
    mediaService as never,
    submodelRepository as never,
    aasRepository as never,
  );
  return {
    controller,
    permalinkApplicationService,
    mediaService,
    submodelRepository,
    aasRepository,
  };
}

describe("MediaPermalinkController (permalink-gated media)", () => {
  it("getInfo serves a public projection of media the passport references (strips internals)", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("m-1")]]);
    const { controller, mediaService, submodelRepository } = make({
      passport: makePassport(["sm-1"]),
      submodels,
    });
    mediaService.findOneOrFail.mockResolvedValue({
      id: "m-1",
      title: "doc.pdf",
      mimeType: "application/pdf",
      size: 42,
      bucket: "secret-bucket",
      objectName: "product-passport-files/abc",
      ownedByOrganizationId: "org-1",
      createdByUserId: "user-1",
    });

    const result = await controller.getInfo("slug-1", "m-1", undefined);

    expect(submodelRepository.findByIds).toHaveBeenCalledWith(["sm-1"]);
    expect(mediaService.findOneOrFail).toHaveBeenCalledWith("m-1");
    // only the public MediaInfoDto fields — no bucket/objectName/org/user leakage
    expect(result).toEqual({ id: "m-1", title: "doc.pdf", mimeType: "application/pdf", size: 42 });
  });

  it("getInfo serves a media referenced only as a shell default thumbnail", async () => {
    const shells = new Map([["shell-1", shellWithThumbnail("m-1")]]);
    const { controller, aasRepository, submodelRepository } = make({
      passport: makePassport([], ["shell-1"]),
      shells,
    });

    await controller.getInfo("slug-1", "m-1", undefined);

    expect(aasRepository.findByIds).toHaveBeenCalledWith(["shell-1"]);
    // a thumbnail hit does not need the (heavier) submodel walk
    expect(submodelRepository.findByIds).not.toHaveBeenCalled();
  });

  it("getInfo 404s when the media is NOT referenced by the resolved passport (IDOR guard)", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("some-other-media")]]);
    const shells = new Map([["shell-1", shellWithThumbnail("some-other-thumbnail")]]);
    const { controller } = make({
      passport: makePassport(["sm-1"], ["shell-1"]),
      submodels,
      shells,
    });
    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("getInfo 404s when the permalink cannot be resolved (deleted/unpublished)", async () => {
    const { controller, permalinkApplicationService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(new Error("not found"));
    await expect(controller.getInfo("missing", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("anonymous callers hit the permalink gate without a user (published passports only)", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("m-1")]]);
    const { controller, permalinkApplicationService } = make({
      passport: makePassport(["sm-1"]),
      submodels,
    });

    await controller.getInfo("slug-1", "m-1", undefined);

    expect(permalinkApplicationService.resolveToPassport).toHaveBeenCalledWith("slug-1", {
      userId: undefined,
    });
  });

  it("forwards the caller's session to the permalink gate so members can preview draft media", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("m-1")]]);
    const { controller, permalinkApplicationService } = make({
      passport: makePassport(["sm-1"]),
      submodels,
    });
    const session = { userId: "u-1" } as never;

    await controller.getInfo("slug-1", "m-1", session);

    expect(permalinkApplicationService.resolveToPassport).toHaveBeenCalledWith("slug-1", {
      userId: "u-1",
    });
  });

  it("download streams a referenced media", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("m-1")]]);
    const { controller, mediaService } = make({ passport: makePassport(["sm-1"]), submodels });
    const pipe = jest.fn();
    const on = jest.fn();
    mediaService.getFilestreamById.mockResolvedValue({
      media: { mimeType: "application/pdf", updatedAt: new Date() },
      stream: { pipe, on },
    });
    const res = makeRes();

    await controller.download("slug-1", "m-1", undefined, res);

    expect(mediaService.getFilestreamById).toHaveBeenCalledWith("m-1");
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it("download streams a shell default thumbnail", async () => {
    const shells = new Map([["shell-1", shellWithThumbnail("m-1")]]);
    const { controller, mediaService } = make({ passport: makePassport([], ["shell-1"]), shells });
    const pipe = jest.fn();
    mediaService.getFilestreamById.mockResolvedValue({
      media: { mimeType: "image/webp", updatedAt: new Date() },
      stream: { pipe, on: jest.fn() },
    });
    const res = makeRes();

    await controller.download("slug-1", "m-1", undefined, res);

    expect(pipe).toHaveBeenCalledWith(res);
  });

  it("download 404s when the media is not referenced", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("other")]]);
    const { controller } = make({ passport: makePassport(["sm-1"]), submodels });
    const res = makeRes();
    await controller.download("slug-1", "m-1", undefined, res);
    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
  });
});
