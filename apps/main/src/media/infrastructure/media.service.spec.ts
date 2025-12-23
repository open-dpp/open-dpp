import type { MediaService } from "./media.service";
import { Buffer } from "node:buffer";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { EnvService } from "@open-dpp/env";
import { Media } from "../domain/media";
import { MediaDoc } from "./media.schema";

// Mocks setup
const mockMinioInstance = {
  bucketExists: jest.fn<any>(),
  putObject: jest.fn<any>(),
  getObject: jest.fn<any>(),
};

const mockMinioClient = jest.fn(() => mockMinioInstance);

jest.unstable_mockModule("minio", () => ({
  Client: mockMinioClient,
}));

jest.unstable_mockModule("sharp", () => ({
  default: jest.fn(() => ({
    webp: jest.fn(() => ({
      toBuffer: jest.fn<any>().mockResolvedValue(Buffer.from("processed-image")),
    })),
  })),
}));

const mockFileTypeFromBuffer = jest.fn<any>();
jest.unstable_mockModule("./file-type-util", () => ({
  fileTypeFromBuffer: mockFileTypeFromBuffer,
}));

describe("MediaService", () => {
  let service: MediaService;
  let MediaServiceClass: typeof MediaService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, any> = {
        OPEN_DPP_S3_ENDPOINT: "localhost",
        OPEN_DPP_S3_PORT: 9000,
        OPEN_DPP_S3_SSL: false,
        OPEN_DPP_S3_ACCESS_KEY: "minio",
        OPEN_DPP_S3_SECRET_KEY: "minio123",
        OPEN_DPP_S3_DEFAULT_BUCKET: "default-bucket",
        OPEN_DPP_S3_PROFILE_PICTURE_BUCKET: "profile-bucket",
      };
      return config[key];
    }),
  };

  const mockMediaModel = {
    find: jest.fn<any>(),
    deleteMany: jest.fn<any>(),
    findOneAndUpdate: jest.fn<any>(),
    findById: jest.fn<any>(),
    deleteOne: jest.fn<any>(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

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
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({ etag: "etag123", versionId: "v1" });

      const result = await service.uploadFile(
        "bucket",
        Buffer.from("test"),
        "file.txt",
        [],
        4,
        "text/plain",
      );

      expect(mockMinioInstance.bucketExists).toHaveBeenCalledWith("bucket");
      expect(mockMinioInstance.putObject).toHaveBeenCalled();
      expect(result.location.objectName).toBe("file.txt");
      expect(result.info.etag).toBe("etag123");
    });

    it("should throw if bucket does not exist", async () => {
      mockMinioInstance.bucketExists.mockResolvedValue(false);
      await expect(
        service.uploadFile("bucket", Buffer.from("test"), "file", [], 4, "text/plain"),
      ).rejects.toThrow("Bucket bucket does not exist");
    });
  });

  describe("uploadProfilePicture", () => {
    it("should upload profile picture to profile bucket", async () => {
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({});

      const buffer = Buffer.from("image");
      await service.uploadProfilePicture(buffer, "user-id");

      expect(mockMinioInstance.bucketExists).toHaveBeenCalledWith("profile-bucket");
      expect(mockMinioInstance.putObject).toHaveBeenCalledWith(
        "profile-bucket",
        "user-id",
        buffer,
        buffer.length,
        { "Content-Type": "image/webp" },
      );
    });
  });

  describe("processImageBuffer", () => {
    it("should process image using sharp", async () => {
      const buffer = Buffer.from("raw");
      const processed = await service.processImageBuffer(buffer);
      expect(processed.toString()).toBe("processed-image");
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
      mockFileTypeFromBuffer.mockResolvedValue({ mime: "application/pdf", ext: "pdf" });
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
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
      expect(mockMinioInstance.putObject).toHaveBeenCalled();
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Media);
    });

    it("should delete existing media if found", async () => {
      mockMediaModel.find.mockResolvedValue([{ _id: "existing" }]);
      mockFileTypeFromBuffer.mockResolvedValue({ mime: "application/pdf", ext: "pdf" });
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({ etag: "etag", versionId: "v1" });
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

    it("should process image if mimetype starts with image/", async () => {
      mockMediaModel.find.mockResolvedValue([]);
      mockFileTypeFromBuffer.mockResolvedValue({ mime: "image/png", ext: "png" });
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue({
        ...validMediaDoc,
        mimeType: "image/webp",
      });

      await service.uploadFileOfProductPassport(
        "img.png",
        Buffer.from("img"),
        "fid",
        "upid",
        "uid",
        "oid",
      );

      expect(mockMinioInstance.putObject).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ length: 15 }), // "processed-image".length
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe("uploadMedia", () => {
    it("should upload media", async () => {
      mockFileTypeFromBuffer.mockResolvedValue({ mime: "application/pdf", ext: "pdf" });
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.putObject.mockResolvedValue({ etag: "etag" });
      mockMediaModel.findOneAndUpdate.mockResolvedValue(validMediaDoc);

      const result = await service.uploadMedia("file.pdf", Buffer.from("test"), "uid", "oid");
      expect(mockMinioInstance.putObject).toHaveBeenCalled();
      expect(mockMediaModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Media);
    });
  });

  describe("getFileStream", () => {
    it("should return stream", async () => {
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      const streamMock = "stream";
      mockMinioInstance.getObject.mockResolvedValue(streamMock);

      const result = await service.getFileStream("bucket", "file");
      expect(result).toBe(streamMock);
    });

    it("should throw if bucket does not exist", async () => {
      mockMinioInstance.bucketExists.mockResolvedValue(false);
      await expect(service.getFileStream("bucket", "file")).rejects.toThrow();
    });
  });

  describe("getFilestreamOfProductPassport", () => {
    it("should return stream and media", async () => {
      mockMediaModel.find.mockResolvedValue([validMediaDoc]);
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.getObject.mockResolvedValue("stream");

      const result = await service.getFilestreamOfProductPassport("fid", "upid");
      expect(result.stream).toBe("stream");
      expect(result.media).toBeInstanceOf(Media);
    });
  });

  describe("getFilestreamById", () => {
    it("should return stream and media", async () => {
      mockMediaModel.findById.mockResolvedValue(validMediaDoc);
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.getObject.mockResolvedValue("stream");

      const result = await service.getFilestreamById("id");
      expect(result.stream).toBe("stream");
      expect(result.media).toBeInstanceOf(Media);
    });
  });

  describe("getFilestreamOfMedia", () => {
    it("should return stream", async () => {
      mockMinioInstance.bucketExists.mockResolvedValue(true);
      mockMinioInstance.getObject.mockResolvedValue("stream");
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
