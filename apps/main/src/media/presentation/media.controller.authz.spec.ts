import { describe, expect, it, jest } from "@jest/globals";
import { NotFoundException } from "@nestjs/common";
import { HEADERS_METADATA } from "@nestjs/common/constants";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { MediaController } from "./media.controller";

const MEDIA = {
  id: "m-1",
  ownedByOrganizationId: "org-1",
  mimeType: "image/png",
  title: "x",
  size: 1,
};
const SESSION = { userId: "u-1" } as never;

function makeRes() {
  const res: Record<string, unknown> = { headersSent: false };
  res.setHeader = jest.fn();
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.destroy = jest.fn();
  return res as never;
}

function make(isMember: boolean) {
  const filesService = {
    findOneOrFail: jest.fn<any>(async () => MEDIA),
    getFilestreamOfMedia: jest.fn<any>(async () => ({ pipe: jest.fn(), on: jest.fn() })),
    deleteFileById: jest.fn<any>(async () => undefined),
  };
  const membersService = {
    isMemberOfOrganization: jest.fn<any>(async () => isMember),
  };
  const controller = new MediaController(filesService as never, membersService as never);
  return { controller, filesService, membersService };
}

describe("MediaController bare /media/:id — membership gate (cross-org IDOR)", () => {
  it("derives authorization from the media's OWNING org, not the request", async () => {
    const { controller, membersService } = make(true);
    await controller.getMediaInfo("m-1", SESSION);
    expect(membersService.isMemberOfOrganization).toHaveBeenCalledWith("u-1", "org-1");
  });

  describe("non-member caller", () => {
    it("download → 404, stream never opened", async () => {
      const { controller, filesService } = make(false);
      const res = makeRes();
      await controller.streamFile("m-1", SESSION, res);
      expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
      expect(filesService.getFilestreamOfMedia).not.toHaveBeenCalled();
    });

    it("info → NotFoundException", async () => {
      const { controller } = make(false);
      await expect(controller.getMediaInfo("m-1", SESSION)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("delete → NotFoundException, nothing deleted", async () => {
      const { controller, filesService } = make(false);
      await expect(controller.deleteFile("m-1", SESSION)).rejects.toBeInstanceOf(NotFoundException);
      expect(filesService.deleteFileById).not.toHaveBeenCalled();
    });
  });

  it("not-found media throws the SAME NotFoundException as not-member (no existence oracle)", async () => {
    const { controller, filesService } = make(true);
    filesService.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException("Media"));
    // same exception type/shape whether the media is absent or the caller is not a member
    await expect(controller.getMediaInfo("missing", SESSION)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("download of missing media → 404, stream never opened", async () => {
    const { controller, filesService } = make(true);
    filesService.findOneOrFail.mockRejectedValue(new NotFoundInDatabaseException("Media"));
    const res = makeRes();
    await controller.streamFile("missing", SESSION, res);
    expect((res as unknown as { status: jest.Mock }).status).toHaveBeenCalledWith(404);
    expect(filesService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  describe("member caller", () => {
    it("download streams the media", async () => {
      const { controller, filesService } = make(true);
      const res = makeRes();
      await controller.streamFile("m-1", SESSION, res);
      expect(filesService.getFilestreamOfMedia).toHaveBeenCalled();
      expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalledWith(404);
    });

    it("info returns the public projection", async () => {
      const { controller } = make(true);
      const info = await controller.getMediaInfo("m-1", SESSION);
      expect(info).toEqual({ id: "m-1", title: "x", mimeType: "image/png", size: 1 });
    });

    it("delete removes the media", async () => {
      const { controller, filesService } = make(true);
      await controller.deleteFile("m-1", SESSION);
      expect(filesService.deleteFileById).toHaveBeenCalledWith("m-1");
    });
  });
});

describe("MediaController bare /media/:id — operational failures are not masked as 404", () => {
  it("download rethrows database failures from the media lookup", async () => {
    const { controller, filesService } = make(true);
    filesService.findOneOrFail.mockRejectedValue(new Error("MongoNetworkError: connection lost"));
    const res = makeRes();

    await expect(controller.streamFile("m-1", SESSION, res)).rejects.toThrow("connection lost");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
    expect(filesService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download rethrows failures from the membership lookup", async () => {
    const { controller, filesService, membersService } = make(true);
    membersService.isMemberOfOrganization.mockRejectedValue(new Error("MongoServerError: timeout"));
    const res = makeRes();

    await expect(controller.streamFile("m-1", SESSION, res)).rejects.toThrow("timeout");

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
    expect(filesService.getFilestreamOfMedia).not.toHaveBeenCalled();
  });

  it("download rethrows object-store failures when opening the stream", async () => {
    const { controller, filesService } = make(true);
    filesService.getFilestreamOfMedia.mockRejectedValue(new Error("Bucket does not exist"));
    const res = makeRes();

    await expect(controller.streamFile("m-1", SESSION, res)).rejects.toThrow(
      "Bucket does not exist",
    );

    expect((res as unknown as { status: jest.Mock }).status).not.toHaveBeenCalled();
  });

  it("info rethrows database failures from the media lookup instead of a NotFoundException", async () => {
    const { controller, filesService } = make(true);
    filesService.findOneOrFail.mockRejectedValue(new Error("MongoNetworkError: connection lost"));

    await expect(controller.getMediaInfo("m-1", SESSION)).rejects.toThrow("connection lost");
  });

  it("delete rethrows database failures from the media lookup, nothing deleted", async () => {
    const { controller, filesService } = make(true);
    filesService.findOneOrFail.mockRejectedValue(new Error("MongoNetworkError: connection lost"));

    await expect(controller.deleteFile("m-1", SESSION)).rejects.toThrow("connection lost");

    expect(filesService.deleteFileById).not.toHaveBeenCalled();
  });
});

describe("MediaController bare /media/:id — response caching", () => {
  it.each(["getMediaInfo", "streamFile"] as const)(
    "%s declares Cache-Control: no-store so a gated response is never reused after access is revoked",
    (method) => {
      const headers = Reflect.getMetadata(HEADERS_METADATA, MediaController.prototype[method]);

      expect(headers).toEqual(
        expect.arrayContaining([{ name: "Cache-Control", value: "no-store" }]),
      );
    },
  );
});
