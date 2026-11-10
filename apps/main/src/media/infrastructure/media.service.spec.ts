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
const { mockS3Client, mockProcessMediaUpload } = vi.hoisted(() => ({
  mockS3Client: {
    bucketExists: vi.fn<any>(),
    putObject: vi.fn<any>(),
    getObject: vi.fn<any>(),
    removeObject: vi.fn<any>(),
  },
  mockProcessMediaUpload: vi.fn<any>(),
}));

vi.mock("minio", () => ({
  // `new Client(...)` needs a constructible implementation, not an arrow function.
  Client: vi.fn(function () {
    return mockS3Client;
  }),
}));

// Detection, sanitizing and re-encoding are covered by media-upload-processor.spec.ts.
vi.mock("./media-upload/media-upload-processor", () => ({
  processMediaUpload: mockProcessMediaUpload,
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

  describe("uploadFileOfProductPassport", () => {
    it("should upload file and save media", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      mockProcessMediaUpload.mockResolvedValue(processedPdf);
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

    it("should delete existing media if found", async () => {
      mockMediaModel.find.mockResolvedValue([{ _id: "existing" }]);
      mockProcessMediaUpload.mockResolvedValue(processedPdf);
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

      expect(mockMediaModel.deleteMany).toHaveBeenCalledWith({
        dataFieldId: "field-id",
        uniqueProductIdentifier: "upid",
      });
    });

    it("stores the processed file, checked against the media upload types", async () => {
      const upload = Buffer.from("img");
      mockMediaModel.find.mockResolvedValue([]);
      mockProcessMediaUpload.mockResolvedValue({
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

      expect(mockProcessMediaUpload).toHaveBeenCalledWith(upload, MEDIA_UPLOAD_MIME_TYPES);
      expect(mockS3Client.putObject).toHaveBeenCalledWith(
        "default-bucket",
        "product-passport-files/upid/fid",
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
      mockProcessMediaUpload.mockRejectedValue(new ValueError("unsupported"));

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
      mockProcessMediaUpload.mockResolvedValue(processedPdf);
      mockS3Client.bucketExists.mockResolvedValue(true);
      mockS3Client.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      const result = await service.uploadMedia("file.pdf", upload, "uid", "oid");

      expect(mockProcessMediaUpload).toHaveBeenCalledWith(upload, MEDIA_UPLOAD_MIME_TYPES);
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
      mockProcessMediaUpload.mockResolvedValue({
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

      expect(mockProcessMediaUpload).toHaveBeenCalledWith(
        upload,
        ORGANIZATION_PROFILE_UPLOAD_MIME_TYPES,
      );
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
