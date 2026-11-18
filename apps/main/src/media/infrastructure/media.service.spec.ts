import type { MediaService } from "./media.service";
import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { MEDIA_UPLOAD_MIME_TYPES, ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { ValueError } from "@open-dpp/exception";
import { Media } from "../domain/media";
import { MediaDoc } from "./media.schema";

// `vi.mock` is hoisted above the imports, so its factories may only use what `vi.hoisted` declares.
const { mockS3Client, mockDetectMediaProcessor, mockProcess, MockS3Error } = vi.hoisted(() => {
  const mockProcess = vi.fn<any>();
  return {
    MockS3Error: class MockS3Error extends Error {
      constructor(readonly code: string) {
        super(code);
      }
    },
    mockS3Client: {
      bucketExists: vi.fn<any>(),
      putObject: vi.fn<any>(),
      getObject: vi.fn<any>(),
      removeObject: vi.fn<any>(),
    },
    mockProcess,
    // Every upload gets a processor whose `process` is `mockProcess`.
    mockDetectMediaProcessor: vi.fn<any>(async () => ({ process: mockProcess })),
  };
});

vi.mock("minio", () => ({
  // `new Client(...)` needs a constructible implementation, not an arrow function.
  Client: vi.fn(function () {
    return mockS3Client;
  }),
  S3Error: MockS3Error,
}));

// Detection, sanitizing and re-encoding are covered by media-upload-processor.spec.ts.
vi.mock("./media-upload/media-upload-processor", () => ({
  detectMediaProcessor: mockDetectMediaProcessor,
}));

const processedPdf = {
  buffer: Buffer.from("processed"),
  mimeType: "application/pdf",
  fileExtension: "pdf",
};

describe("MediaService", () => {
  let service: MediaService;
  let MediaServiceClass: typeof MediaService;

  const mockConfigService = {
    get: vi.fn((key: string) => {
      const config: Record<string, any> = {
        OPEN_DPP_S3_ENDPOINT: "localhost",
        OPEN_DPP_S3_PORT: 9000,
        OPEN_DPP_S3_SSL: false,
        OPEN_DPP_S3_ACCESS_KEY: "test-access-key",
        OPEN_DPP_S3_SECRET_KEY: "test-secret-key",
        OPEN_DPP_S3_DEFAULT_BUCKET: "default-bucket",
        OPEN_DPP_S3_PROFILE_PICTURE_BUCKET: "profile-bucket",
      };
      return config[key];
    }),
  };

  const mockMediaModel = {
    find: vi.fn<any>(),
    deleteMany: vi.fn<any>(),
    findOneAndUpdate: vi.fn<any>(),
    findById: vi.fn<any>(),
    deleteOne: vi.fn<any>(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    if (!MediaServiceClass) {
      const module = await import("./media.service");
      MediaServiceClass = module.MediaService;
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaServiceClass,
        {
          provide: EnvService,
          useValue: mockConfigService,
        },
        {
          provide: getModelToken(MediaDoc.name),
          useValue: mockMediaModel,
        },
      ],
    }).compile();

    service = module.get(MediaServiceClass);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("buildBucketPath", () => {
    it("should build path correctly", () => {
      const path = service.buildBucketPath("file.txt", ["folder1", "folder2"]);
      expect(path).toBe("folder1/folder2/file.txt");
    });
  });

  describe("uploadFile", () => {
    it("should upload file successfully", async () => {
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag123", versionId: "v1" });

      const result = await service.uploadFile(
        "bucket",
        Buffer.from("test"),
        "file.txt",
        [],
        4,
        "text/plain",
      );

      expect(mockS3Client.bucketExists).toHaveBeenCalledWith("bucket");
      expect(mockS3Client.putObject).toHaveBeenCalled();
      expect(result.location.objectName).toBe("file.txt");
      expect(result.info.etag).toBe("etag123");
    });

    it("should throw if bucket does not exist", async () => {
      mockS3Client.bucketExists.mockResolvedValue(false);
      await expect(
        service.uploadFile("bucket", Buffer.from("test"), "file", [], 4, "text/plain"),
      ).rejects.toThrow("Bucket bucket does not exist");
    });
  });

  const validMediaDoc = {
    _id: "media-id",
    ownedByOrganizationId: "org-id",
    createdByUserId: "user-id",
    title: "file.pdf",
    description: "file.pdf",
    mimeType: "application/pdf",
    fileExtension: "pdf",
    size: 4,
    originalFilename: "file.pdf",
    createdAt: new Date(),
    updatedAt: new Date(),
    uniqueProductIdentifier: "upid",
    dataFieldId: "field-id",
    bucket: "default-bucket",
    objectName: "folder/upid/field-id",
    eTag: "etag",
    versionId: "v1",
  };

  /** The fields the first save wrote to the media. */
  const writtenByFirstSave = () => mockMediaModel.findOneAndUpdate.mock.calls[0][1] as object;

  describe("uploadFileOfProductPassport", () => {
    it("should upload file and save media", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      const buffer = Buffer.from("test");
      const result = await service.uploadFileOfProductPassport(
        "file.pdf",
        buffer,
        "field-id",
        "upid",
        "user-id",
        "org-id",
      );

      expect(mockMediaModel.find).toHaveBeenCalled();
      expect(mockS3Client.putObject).toHaveBeenCalled();
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Media);
    });

    it("creates a media nobody has updated when the passport field has no file yet", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      await service.uploadFileOfProductPassport(
        "file.pdf",
        Buffer.from("test"),
        "field-id",
        "upid",
        "user-id",
        "org-id",
      );

      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          createdByUserId: "user-id",
          ownedByOrganizationId: "org-id",
          updatedByUserId: null,
        }),
        expect.anything(),
      );
      expect(mockMediaModel.deleteMany).not.toHaveBeenCalled();
    });

    it("replaces the file of the existing media in place", async () => {
      const existing = {
        ...validMediaDoc,
        _id: "existing",
        createdByUserId: "creator",
        ownedByOrganizationId: "creator-org",
      };
      mockMediaModel.find.mockResolvedValue([existing]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(existing);

      const result = await service.uploadFileOfProductPassport(
        "new.pdf",
        Buffer.from("test"),
        "field-id",
        "upid",
        "replacer",
        "org-id",
      );

      expect(result.id).toBe("existing");
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "existing" },
        expect.objectContaining({
          createdByUserId: "creator",
          ownedByOrganizationId: "creator-org",
          updatedByUserId: "replacer",
          title: "new.pdf",
          originalFilename: "new.pdf",
          mimeType: "application/pdf",
          fileExtension: "pdf",
          size: processedPdf.buffer.length,
          eTag: "new-etag",
          versionId: "v2",
          createdAt: existing.createdAt,
        }),
        expect.anything(),
      );
      expect(mockMediaModel.deleteMany).not.toHaveBeenCalled();
    });

    it("stores a replacement under a new object key and removes the previous object after the save", async () => {
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await service.uploadFileOfProductPassport(
        "new.pdf",
        Buffer.from("test"),
        "field-id",
        "upid",
        "replacer",
        "org-id",
      );

      const newObjectName = mockS3Client.putObject.mock.calls[0][1];
      expect(newObjectName).toMatch(/^product-passport-files\/upid\/field-id-/);
      expect(newObjectName).not.toBe(validMediaDoc.objectName);
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "existing" },
        expect.objectContaining({ objectName: newObjectName }),
        expect.anything(),
      );
      expect(mockS3Client.removeObject).toHaveBeenCalledTimes(1);
      expect(mockS3Client.removeObject).toHaveBeenCalledWith(
        validMediaDoc.bucket,
        validMediaDoc.objectName,
      );
      expect(mockMediaModel.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        mockS3Client.removeObject.mock.invocationCallOrder[0],
      );
    });

    it("removes the new object and keeps the previous one when saving the replacement fails", async () => {
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockRejectedValue(new Error("database unavailable"));
      // The media still points to the previous object.
      mockMediaModel.findById.mockResolvedValue({ ...validMediaDoc, _id: "existing" });
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFileOfProductPassport(
          "new.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "replacer",
          "org-id",
        ),
      ).rejects.toThrow("database unavailable");

      const newObjectName = mockS3Client.putObject.mock.calls[0][1];
      expect(mockMediaModel.findById).toHaveBeenCalledWith("existing", expect.anything());
      expect(mockS3Client.removeObject).toHaveBeenCalledTimes(1);
      expect(mockS3Client.removeObject).toHaveBeenCalledWith("default-bucket", newObjectName);
      expect(mockMediaModel.deleteMany).not.toHaveBeenCalled();
    });

    it("removes the new object when a new media cannot be saved", async () => {
      const saveError = new Error("database unavailable");
      mockMediaModel.find.mockResolvedValue([]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
      mockMediaModel.findOneAndUpdate.mockRejectedValue(saveError);
      mockMediaModel.findById.mockResolvedValue(null);
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFileOfProductPassport(
          "file.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "user-id",
          "org-id",
        ),
      ).rejects.toBe(saveError);

      const newObjectName = mockS3Client.putObject.mock.calls[0][1];
      expect(mockS3Client.removeObject).toHaveBeenCalledTimes(1);
      expect(mockS3Client.removeObject).toHaveBeenCalledWith("default-bucket", newObjectName);
    });

    it("keeps the new object when the save fails after the media was written", async () => {
      // The driver can report an error although the update was applied.
      const saveError = new Error("connection reset");
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockRejectedValue(saveError);
      mockMediaModel.findById.mockImplementation(async () => ({
        ...validMediaDoc,
        _id: "existing",
        ...writtenByFirstSave(),
      }));
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFileOfProductPassport(
          "new.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "replacer",
          "org-id",
        ),
      ).rejects.toBe(saveError);

      expect(mockMediaModel.findById).toHaveBeenCalledWith("existing", expect.anything());
      expect(mockS3Client.removeObject).not.toHaveBeenCalled();
    });

    it("keeps the new object when the written media cannot be converted", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
      // `convertToDomain` fails on what the update returns, after the media was written.
      mockMediaModel.findOneAndUpdate.mockResolvedValue(null);
      mockMediaModel.findById.mockImplementation(async () => ({
        ...validMediaDoc,
        ...writtenByFirstSave(),
      }));
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFileOfProductPassport(
          "file.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "user-id",
          "org-id",
        ),
      ).rejects.toThrow(TypeError);

      expect(mockS3Client.removeObject).not.toHaveBeenCalled();
    });

    it("keeps the new object and reports the save error when the media cannot be read either", async () => {
      const saveError = new Error("connection reset");
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockRejectedValue(saveError);
      mockMediaModel.findById.mockRejectedValue(new Error("database unavailable"));
      mockS3Client.removeObject.mockResolvedValue(undefined);

      await expect(
        service.uploadFileOfProductPassport(
          "new.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "replacer",
          "org-id",
        ),
      ).rejects.toBe(saveError);

      expect(mockS3Client.removeObject).not.toHaveBeenCalled();
    });

    it("reports the save error when the new object cannot be removed either", async () => {
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockRejectedValue(new Error("database unavailable"));
      mockMediaModel.findById.mockResolvedValue({ ...validMediaDoc, _id: "existing" });
      mockS3Client.removeObject.mockRejectedValue(new Error("bucket unavailable"));

      await expect(
        service.uploadFileOfProductPassport(
          "new.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "replacer",
          "org-id",
        ),
      ).rejects.toThrow("database unavailable");
    });

    it("keeps a saved replacement when its previous object cannot be removed", async () => {
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "new-etag", versionId: "v2" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);
      mockS3Client.removeObject.mockRejectedValue(new Error("bucket unavailable"));

      const result = await service.uploadFileOfProductPassport(
        "new.pdf",
        Buffer.from("test"),
        "field-id",
        "upid",
        "replacer",
        "org-id",
      );

      expect(result.id).toBe("existing");
      expect(mockS3Client.removeObject).toHaveBeenCalled();
    });

    it("keeps the existing media when the upload to the bucket fails", async () => {
      mockMediaModel.find.mockResolvedValue([{ ...validMediaDoc, _id: "existing" }]);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockRejectedValue(new Error("bucket unavailable"));

      await expect(
        service.uploadFileOfProductPassport(
          "new.pdf",
          Buffer.from("test"),
          "field-id",
          "upid",
          "replacer",
          "org-id",
        ),
      ).rejects.toThrow("bucket unavailable");

      expect(mockMediaModel.deleteMany).not.toHaveBeenCalled();
      expect(mockMediaModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("removes further media of the same passport field after the replacement is saved", async () => {
      mockMediaModel.find.mockResolvedValue([
        { ...validMediaDoc, _id: "existing" },
        { ...validMediaDoc, _id: "duplicate-1", objectName: "folder/upid/field-id-1" },
        // Before each upload got its own key, all media of a field shared one object.
        { ...validMediaDoc, _id: "duplicate-2" },
      ]);
      mockS3Client.removeObject.mockResolvedValue(undefined);
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      await service.uploadFileOfProductPassport(
        "new.pdf",
        Buffer.from("test"),
        "field-id",
        "upid",
        "replacer",
        "org-id",
      );

      // A fixed order, so concurrent uploads keep the same media of several.
      expect(mockMediaModel.find).toHaveBeenCalledWith(
        { dataFieldId: "field-id", uniqueProductIdentifier: "upid" },
        null,
        { sort: { _id: 1 } },
      );
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "existing" },
        expect.anything(),
        expect.anything(),
      );
      expect(mockMediaModel.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ["duplicate-1", "duplicate-2"] },
      });
      expect(mockMediaModel.findOneAndUpdate.mock.invocationCallOrder[0]).toBeLessThan(
        mockMediaModel.deleteMany.mock.invocationCallOrder[0],
      );
      expect(mockS3Client.removeObject.mock.calls).toEqual([
        ["default-bucket", "folder/upid/field-id"],
        ["default-bucket", "folder/upid/field-id-1"],
      ]);
    });

    it("stores the processed file, checked against the media upload types", async () => {
      const upload = Buffer.from("img");
      mockMediaModel.find.mockResolvedValue([]);
      mockProcess.mockResolvedValue({
        buffer: Buffer.from("processed-image"),
        mimeType: "image/webp",
        fileExtension: "webp",
      });
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue({
        ...validMediaDoc,
        mimeType: "image/webp",
      });

      await service.uploadFileOfProductPassport("img.png", upload, "fid", "upid", "uid", "oid");

      expect(mockDetectMediaProcessor).toHaveBeenCalledWith(upload);
      expect(mockProcess).toHaveBeenCalledWith(upload, MEDIA_UPLOAD_MIME_TYPES);
      expect(mockS3Client.putObject).toHaveBeenCalledWith(
        "default-bucket",
        expect.stringMatching(/^product-passport-files\/upid\/fid-/),
        Buffer.from("processed-image"),
        15, // "processed-image".length
        { "Content-Type": "image/webp" },
      );
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mimeType: "image/webp", fileExtension: "webp", size: 15 }),
        expect.anything(),
      );
    });

    it("keeps the existing media when the new file is rejected", async () => {
      mockMediaModel.find.mockResolvedValue([{ _id: "existing" }]);
      mockProcess.mockRejectedValue(new ValueError("unsupported"));

      await expect(
        service.uploadFileOfProductPassport("a.txt", Buffer.from("x"), "fid", "upid", "uid", "oid"),
      ).rejects.toThrow(ValueError);

      expect(mockMediaModel.deleteMany).not.toHaveBeenCalled();
      expect(mockS3Client.putObject).not.toHaveBeenCalled();
    });
  });

  describe("uploadMedia", () => {
    it("should upload media", async () => {
      const upload = Buffer.from("test");
      mockProcess.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      const result = await service.uploadMedia("file.pdf", upload, "uid", "oid");

      expect(mockDetectMediaProcessor).toHaveBeenCalledWith(upload);
      expect(mockProcess).toHaveBeenCalledWith(upload, MEDIA_UPLOAD_MIME_TYPES);
      expect(mockS3Client.putObject).toHaveBeenCalledWith(
        "default-bucket",
        expect.stringMatching(/^product-passport-files\//),
        processedPdf.buffer,
        processedPdf.buffer.length,
        { "Content-Type": "application/pdf" },
      );
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Media);
    });

    it("checks the file against the given types and stores it in the given folders", async () => {
      const upload = Buffer.from("logo");
      mockProcess.mockResolvedValue({
        buffer: Buffer.from("<svg/>"),
        mimeType: "image/svg+xml",
        fileExtension: "svg",
      });
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      await service.uploadMedia("logo.svg", upload, "uid", "oid", {
        allowedMimeTypes: ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
        remoteFolders: ["organization-profile-pictures"],
      });

      expect(mockDetectMediaProcessor).toHaveBeenCalledWith(upload);
      expect(mockProcess).toHaveBeenCalledWith(upload, ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES);
      expect(mockS3Client.putObject).toHaveBeenCalledWith(
        "default-bucket",
        expect.stringMatching(/^organization-profile-pictures\//),
        Buffer.from("<svg/>"),
        6,
        { "Content-Type": "image/svg+xml" },
      );
    });
  });

  describe("getFileStream", () => {
    it("should return stream", async () => {
      mockS3Client.bucketExists.mockResolvedValue(true);
      const streamMock = "stream";
      mockS3Client.getObject.mockResolvedValue(streamMock);

      const result = await service.getFileStream("bucket", "file");
      expect(result).toBe(streamMock);
    });

    it("should throw if bucket does not exist", async () => {
      mockS3Client.bucketExists.mockResolvedValue(false);
      await expect(service.getFileStream("bucket", "file")).rejects.toThrow();
    });
  });

  describe("getFilestreamOfProductPassport", () => {
    it("should return stream and media", async () => {
      mockMediaModel.find.mockResolvedValue([validMediaDoc]);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject.mockResolvedValue("stream");

      const result = await service.getFilestreamOfProductPassport("fid", "upid");
      expect(result.stream).toBe("stream");
      expect(result.media).toBeInstanceOf(Media);
    });

    it("opens the replacement when the file was replaced after the media was read", async () => {
      const replacedMediaDoc = {
        ...validMediaDoc,
        objectName: "folder/upid/field-id-new",
        eTag: "new-etag",
      };
      mockMediaModel.find
        .mockResolvedValueOnce([validMediaDoc])
        .mockResolvedValueOnce([replacedMediaDoc]);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject
        .mockRejectedValueOnce(new MockS3Error("NoSuchKey"))
        .mockResolvedValueOnce("new stream");

      const result = await service.getFilestreamOfProductPassport("fid", "upid");

      expect(mockS3Client.getObject).toHaveBeenLastCalledWith(
        "default-bucket",
        "folder/upid/field-id-new",
      );
      expect(result.stream).toBe("new stream");
      expect(result.media.objectName).toBe("folder/upid/field-id-new");
      expect(result.media.eTag).toBe("new-etag");
    });
  });

  describe("getFilestreamById", () => {
    it("should return stream and media", async () => {
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject.mockResolvedValue("stream");

      const result = await service.getFilestreamById("id");
      expect(result.stream).toBe("stream");
      expect(result.media).toBeInstanceOf(Media);
    });

    it("opens the replacement when the file was replaced after the media was read", async () => {
      mockMediaModel.findById
        .mockResolvedValueOnce(validMediaDoc)
        .mockResolvedValueOnce({ ...validMediaDoc, objectName: "folder/upid/field-id-new" });
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject
        .mockRejectedValueOnce(new MockS3Error("NoSuchKey"))
        .mockResolvedValueOnce("new stream");

      const result = await service.getFilestreamById("id");

      expect(result.stream).toBe("new stream");
      expect(result.media.objectName).toBe("folder/upid/field-id-new");
    });

    it("reports the missing object when the media still points to it", async () => {
      const missing = new MockS3Error("NoSuchKey");
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject.mockRejectedValue(missing);

      await expect(service.getFilestreamById("id")).rejects.toBe(missing);
      expect(mockMediaModel.findById).toHaveBeenCalledTimes(2);
      expect(mockS3Client.getObject).toHaveBeenCalledTimes(1);
    });

    it("does not read the media again when opening the file fails for another reason", async () => {
      const denied = new MockS3Error("AccessDenied");
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject.mockRejectedValue(denied);

      await expect(service.getFilestreamById("id")).rejects.toBe(denied);
      expect(mockMediaModel.findById).toHaveBeenCalledTimes(1);
      expect(mockS3Client.getObject).toHaveBeenCalledTimes(1);
    });
  });

  describe("getFilestreamOfMedia", () => {
    it("should return stream", async () => {
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.getObject.mockResolvedValue("stream");
      const media = Media.loadFromDb({ ...validMediaDoc, id: "id" } as any);

      const result = await service.getFilestreamOfMedia(media);
      expect(result).toBe("stream");
    });
  });

  describe("convertToDomain", () => {
    it("should convert to domain", () => {
      const media = service.convertToDomain(validMediaDoc as any);
      expect(media).toBeInstanceOf(Media);
      expect(media.title).toBe(validMediaDoc.title);
    });
  });

  describe("save", () => {
    it("should save and return domain object", async () => {
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);
      const media = Media.loadFromDb({ ...validMediaDoc, id: "id" } as any);
      const result = await service.save(media);
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Media);
    });
  });

  describe("findOneOrFail", () => {
    it("should return domain object", async () => {
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      const result = await service.findOneOrFail("id");
      expect(result).toBeInstanceOf(Media);
    });

    it("should throw if not found", async () => {
      mockMediaModel.findById.mockResolvedValue(null);
      await expect(service.findOneOrFail("id")).rejects.toThrow();
    });
  });

  describe("findOneDppFileOrFail", () => {
    it("should return domain object", async () => {
      mockMediaModel.find.mockResolvedValue([validMediaDoc]);
      const result = await service.findOneDppFileOrFail("fid", "upid");
      expect(result).toBeInstanceOf(Media);
    });

    it("should throw if not found", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      await expect(service.findOneDppFileOrFail("fid", "upid")).rejects.toThrow();
    });
  });

  describe("findAll", () => {
    it("should return array of domain objects", async () => {
      mockMediaModel.find.mockResolvedValue([validMediaDoc, validMediaDoc]);
      const result = await service.findAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Media);
    });
  });

  describe("removeById", () => {
    it("should call deleteOne", async () => {
      await service.removeById("id");
      expect(mockMediaModel.deleteOne).toHaveBeenCalledWith({ _id: "id" });
    });
  });

  describe("deleteFileById", () => {
    it("should remove object from storage and delete from db", async () => {
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      mockS3Client.removeObject.mockResolvedValue(undefined);
      mockMediaModel.deleteOne.mockResolvedValue(undefined);

      await service.deleteFileById("media-id");

      expect(mockS3Client.removeObject).toHaveBeenCalledWith(
        validMediaDoc.bucket,
        validMediaDoc.objectName,
      );
      expect(mockMediaModel.deleteOne).toHaveBeenCalledWith({ _id: "media-id" });
    });
  });

  describe("findAllByOrganizationId", () => {
    it("should return array of domain objects", async () => {
      mockMediaModel.find.mockResolvedValue([validMediaDoc]);
      const result = await service.findAllByOrganizationId("org-id");
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(Media);
      expect(mockMediaModel.find).toHaveBeenCalledWith(
        { ownedByOrganizationId: "org-id" },
        expect.anything(),
      );
    });
  });
});
