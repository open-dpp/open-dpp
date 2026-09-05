import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { HEADERS_METADATA } from "@nestjs/common/constants";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { File } from "../../aas/domain/submodel-base/file";
import { MediaPermalinkController } from "./media-permalink.controller";

const OWN_ORG = "org-1";
const FOREIGN_ORG = "org-2";

function makePassport(submodelIds: string[], shellIds: string[] = [], organizationId = OWN_ORG) {
  return {
    organizationId,
    getEnvironment: () => ({ submodels: submodelIds, assetAdministrationShells: shellIds }),
  };
}

function makeMedia(overrides: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    title: "doc.pdf",
    mimeType: "application/pdf",
    size: 42,
    ownedByOrganizationId: OWN_ORG,
    updatedAt: new Date(),
    ...overrides,
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
    media?: unknown;
  } = {},
) {
  const permalinkApplicationService = {
    resolveToPassport: jest.fn<any>(async () => ({ passport: opts.passport ?? makePassport([]) })),
  };
  const mediaService = {
    findOneOrFail: jest.fn<any>(async () => opts.media ?? makeMedia()),
    getFilestreamOfMedia: jest.fn<any>(async () => ({ pipe: jest.fn(), on: jest.fn() })),
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

/** A passport whose single submodel holds a File element pointing at `m-1`. */
function makeReferencing(opts: { passport?: unknown; media?: unknown } = {}) {
  const submodels = new Map([["sm-1", submodelReferencing("m-1")]]);
  return make({ passport: opts.passport ?? makePassport(["sm-1"]), submodels, media: opts.media });
}

describe("MediaPermalinkController (permalink-gated media)", () => {
  it("getInfo serves a public projection of media the passport references (strips internals)", async () => {
    const { controller, mediaService, submodelRepository } = makeReferencing({
      media: makeMedia({
        bucket: "secret-bucket",
        objectName: "product-passport-files/abc",
        createdByUserId: "user-1",
      }),
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
    const { controller, mediaService } = make({
      passport: makePassport(["sm-1"], ["shell-1"]),
      submodels,
      shells,
    });
    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    // an unreferenced media is never even looked up
    expect(mediaService.findOneOrFail).not.toHaveBeenCalled();
  });

  it("getInfo 404s when the permalink gate rejects (unpublished / not a member)", async () => {
    const { controller, permalinkApplicationService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(
      new NotFoundException("Permalink not found"),
    );
    await expect(controller.getInfo("missing", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("getInfo 404s when the permalink record is gone (deleted)", async () => {
    const { controller, permalinkApplicationService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(
      new NotFoundInDatabaseException("PermalinkDoc"),
    );
    await expect(controller.getInfo("missing", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("getInfo 404s on a dangling reference (File value points at a deleted media)", async () => {
    const { controller, mediaService } = makeReferencing();
    mediaService.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException("Media"));
    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("anonymous callers hit the permalink gate without a user (published passports only)", async () => {
    const { controller, permalinkApplicationService } = makeReferencing();

    await controller.getInfo("slug-1", "m-1", undefined);

    expect(permalinkApplicationService.resolveToPassport).toHaveBeenCalledWith("slug-1", {
      userId: undefined,
    });
  });

  it("forwards the caller's session to the permalink gate so members can preview draft media", async () => {
    const { controller, permalinkApplicationService } = makeReferencing();
    const session = { userId: "u-1" } as never;

    await controller.getInfo("slug-1", "m-1", session);

    expect(permalinkApplicationService.resolveToPassport).toHaveBeenCalledWith("slug-1", {
      userId: "u-1",
    });
  });

  it("download streams a referenced media", async () => {
    const media = makeMedia();
    const { controller, mediaService } = makeReferencing({ media });
    const pipe = jest.fn();
    mediaService.getFilestreamOfMedia.mockResolvedValue({ pipe, on: jest.fn() });
    const res = makeRes();

    await controller.download("slug-1", "m-1", undefined, res);

    expect(mediaService.findOneOrFail).toHaveBeenCalledWith("m-1");
    expect(mediaService.getFilestreamOfMedia).toHaveBeenCalledWith(media);
    expect(pipe).toHaveBeenCalledWith(res);
  });

  it("download streams a shell default thumbnail", async () => {
    const shells = new Map([["shell-1", shellWithThumbnail("m-1")]]);
    const { controller, mediaService } = make({
      passport: makePassport([], ["shell-1"]),
      shells,
      media: makeMedia({ mimeType: "image/webp" }),
    });
    const pipe = jest.fn();
    mediaService.getFilestreamOfMedia.mockResolvedValue({ pipe, on: jest.fn() });
    const res = makeRes();

    await controller.download("slug-1", "m-1", undefined, res);

    expect(pipe).toHaveBeenCalledWith(res);
  });

  it("download 404s when the media is not referenced", async () => {
    const submodels = new Map([["sm-1", submodelReferencing("other")]]);
    const { controller, mediaService } = make({ passport: makePassport(["sm-1"]), submodels });
    const res = makeRes();
    await controller.download("slug-1", "m-1", undefined, res);
    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.findOneOrFail).not.toHaveBeenCalled();
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download 404s when the permalink gate rejects (unpublished / not a member)", async () => {
    const { controller, permalinkApplicationService, mediaService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(
      new NotFoundException("Permalink not found"),
    );
    const res = makeRes();
    await controller.download("missing", "m-1", undefined, res);
    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download 404s on a dangling reference (File value points at a deleted media)", async () => {
    const { controller, mediaService } = makeReferencing();
    mediaService.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException("Media"));
    const res = makeRes();
    await controller.download("slug-1", "m-1", undefined, res);
    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });
});

describe("MediaPermalinkController — cross-organization references", () => {
  it("getInfo 404s when the referenced media is owned by another organization", async () => {
    const { controller } = makeReferencing({
      media: makeMedia({ ownedByOrganizationId: FOREIGN_ORG }),
    });

    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("download 404s when the referenced media is owned by another organization, stream never opened", async () => {
    const { controller, mediaService } = makeReferencing({
      media: makeMedia({ ownedByOrganizationId: FOREIGN_ORG }),
    });
    const res = makeRes();

    await controller.download("slug-1", "m-1", undefined, res);

    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("a member's draft preview cannot bypass the ownership check either", async () => {
    const { controller } = makeReferencing({
      media: makeMedia({ ownedByOrganizationId: FOREIGN_ORG }),
    });

    await expect(
      controller.getInfo("slug-1", "m-1", { userId: "u-1" } as never),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("ownership is compared against the resolved passport's organization, not a fixed one", async () => {
    const { controller } = makeReferencing({
      passport: makePassport(["sm-1"], [], FOREIGN_ORG),
      media: makeMedia({ ownedByOrganizationId: FOREIGN_ORG }),
    });

    await expect(controller.getInfo("slug-1", "m-1", undefined)).resolves.toEqual({
      id: "m-1",
      title: "doc.pdf",
      mimeType: "application/pdf",
      size: 42,
    });
  });
});

describe("MediaPermalinkController — operational failures are not masked as 404", () => {
  it("getInfo rethrows database failures from the permalink gate", async () => {
    const { controller, permalinkApplicationService, mediaService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(
      new Error("MongoNetworkError: connection lost"),
    );

    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toThrow("connection lost");

    expect(mediaService.findOneOrFail).not.toHaveBeenCalled();
  });

  it("getInfo rethrows repository failures from the reference walk", async () => {
    const { controller, submodelRepository, mediaService } = make({
      passport: makePassport(["sm-1"]),
    });
    submodelRepository.findByIds.mockRejectedValue(new Error("MongoServerError: timeout"));

    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toThrow("timeout");

    expect(mediaService.findOneOrFail).not.toHaveBeenCalled();
  });

  it("getInfo rethrows database failures from the media lookup", async () => {
    const { controller, mediaService } = makeReferencing();
    mediaService.findOneOrFail.mockRejectedValue(new Error("MongoNetworkError: connection lost"));

    await expect(controller.getInfo("slug-1", "m-1", undefined)).rejects.toThrow("connection lost");
  });

  it("download rethrows database failures from the permalink gate, nothing streamed", async () => {
    const { controller, permalinkApplicationService, mediaService } = make();
    permalinkApplicationService.resolveToPassport.mockRejectedValue(
      new Error("MongoNetworkError: connection lost"),
    );
    const res = makeRes();

    await expect(controller.download("slug-1", "m-1", undefined, res)).rejects.toThrow(
      "connection lost",
    );

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download rethrows repository failures from the reference walk, nothing streamed", async () => {
    const { controller, aasRepository, mediaService } = make({
      passport: makePassport([], ["shell-1"]),
    });
    aasRepository.findByIds.mockRejectedValue(new Error("MongoServerError: timeout"));
    const res = makeRes();

    await expect(controller.download("slug-1", "m-1", undefined, res)).rejects.toThrow("timeout");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download rethrows database failures from the media lookup, nothing streamed", async () => {
    const { controller, mediaService } = makeReferencing();
    mediaService.findOneOrFail.mockRejectedValue(new Error("MongoServerError: timeout"));
    const res = makeRes();

    await expect(controller.download("slug-1", "m-1", undefined, res)).rejects.toThrow("timeout");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
    expect(mediaService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download rethrows object-store failures when opening the stream", async () => {
    const { controller, mediaService } = makeReferencing();
    mediaService.getFilestreamOfMedia.mockRejectedValue(new Error("Bucket does not exist"));
    const res = makeRes();

    await expect(controller.download("slug-1", "m-1", undefined, res)).rejects.toThrow(
      "Bucket does not exist",
    );

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
  });
});

describe("MediaPermalinkController — response caching", () => {
  it.each(["getInfo", "download"] as const)(
    "%s declares Cache-Control: no-store so a gated response is never reused after access is revoked",
    (method) => {
      const headers = Reflect.getMetadata(
        HEADERS_METADATA,
        MediaPermalinkController.prototype[method],
      );

      expect(headers).toEqual(
        expect.arrayContaining([{ name: "Cache-Control", value: "no-store" }]),
      );
    },
  );
});
