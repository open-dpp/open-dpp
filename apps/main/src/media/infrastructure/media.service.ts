import type { Model } from "mongoose";
import type { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import _ from "lodash";
import * as Minio from "minio";
import sharp from "sharp";
import { Media } from "../domain/media";
import { fileTypeFromBuffer } from "./file-type-util";
import { MediaDoc } from "./media.schema";

export const BucketDefaultPaths = {
  PRODUCT_PASSPORT_FILES: "product-passport-files",
  ORGANIZATION_PROFILE_PICTURES: "organization-profile-pictures",
} as const;

@Injectable()
export class MediaService {
  private client: Minio.Client;
  private readonly bucketNameDefault: string;
  private readonly bucketNameProfilePictures: string;
  private readonly pathDelimiter = "/";
  private readonly fallbackMediaVersionId = "unversioned";

  private readonly configService: EnvService;
  private mediaDoc: Model<MediaDoc>;

  constructor(
    configService: EnvService,
    @InjectModel(MediaDoc.name)
    mediaDoc: Model<MediaDoc>,
  ) {
    this.configService = configService;
    this.mediaDoc = mediaDoc;
    this.client = new Minio.Client({
      endPoint: configService.get("OPEN_DPP_S3_ENDPOINT") as string,
      port: configService.get("OPEN_DPP_S3_PORT"),
      useSSL: configService.get("OPEN_DPP_S3_SSL"),
      accessKey: configService.get("OPEN_DPP_S3_ACCESS_KEY"),
      secretKey: configService.get("OPEN_DPP_S3_SECRET_KEY"),
      region: "nbg1",
    });
    this.bucketNameDefault = configService.get("OPEN_DPP_S3_DEFAULT_BUCKET") as string;
    this.bucketNameProfilePictures = configService.get(
      "OPEN_DPP_S3_PROFILE_PICTURE_BUCKET",
    ) as string;
  }

  buildBucketPath(objectName: string, remoteFolders: string[] = []) {
    return _.join([...remoteFolders, objectName], this.pathDelimiter);
  }

  async uploadFile(
    bucketName: string,
    buffer: Buffer,
    remoteFileBaseName: string,
    remoteFolders: string[] = [],
    size: number,
    mimeType: string,
  ) {
    const bucketExists = await this.client.bucketExists(bucketName);
    if (!bucketExists) {
      throw new Error(`Bucket ${bucketName} does not exist`);
    }
    const objectName = this.buildBucketPath(remoteFileBaseName, remoteFolders);
    const uploadInfo = await this.client.putObject(
      bucketName,
      objectName,
      buffer,
      size,
      {
        "Content-Type": mimeType,
      },
    );
    return {
      info: uploadInfo,
      location: {
        bucket: bucketName,
        objectName,
      },
    };
  }

  async uploadProfilePicture(buffer: Buffer, userId: string) {
    // TODO: set profile picture for user
    await this.uploadFile(
      this.bucketNameProfilePictures,
      buffer,
      userId,
      [],
      buffer.length,
      "image/webp",
    );
  }

  async processImageBuffer(buffer: Buffer) {
    return await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer();
  }

  async uploadFileOfProductPassport(
    originalFilename: string,
    buffer: Buffer,
    dataFieldId: string,
    uniqueProductIdentifier: string,
    createdByUserId: string,
    ownedByOrganizationId: string,
  ) {
    const findMedia = await this.mediaDoc.find({
      dataFieldId,
      uniqueProductIdentifier,
    });
    if (findMedia.length > 0) {
      await this.mediaDoc.deleteMany({
        dataFieldId,
        uniqueProductIdentifier,
      });
    }
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) {
      throw new Error("File type not recognized");
    }
    let fileTypeMime = fileType.mime;
    let uploadBuffer: Buffer = buffer;
    if (fileType.mime.startsWith("image/")) {
      uploadBuffer = await this.processImageBuffer(uploadBuffer);
      fileTypeMime = "image/webp";
    }
    const uploadInfo = await this.uploadFile(
      this.bucketNameDefault,
      uploadBuffer,
      dataFieldId,
      [BucketDefaultPaths.PRODUCT_PASSPORT_FILES, uniqueProductIdentifier],
      uploadBuffer.length,
      fileTypeMime,
    );
    const media = Media.create({
      createdByUserId,
      ownedByOrganizationId,
      title: originalFilename,
      description: originalFilename,
      mimeType: fileTypeMime,
      fileExtension: fileType.ext,
      size: uploadBuffer.length,
      originalFilename,
      uniqueProductIdentifier,
      dataFieldId,
      bucket: uploadInfo.location.bucket,
      objectName: uploadInfo.location.objectName,
      eTag: uploadInfo.info.etag,
      versionId: uploadInfo.info.versionId || this.fallbackMediaVersionId,
    });
    await this.save(media);
    return media;
  }

  async uploadMedia(
    originalFilename: string,
    buffer: Buffer,
    createdByUserId: string,
    ownedByOrganizationId: string,
    remoteFolders?: string[],
  ) {
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType) {
      throw new Error("File type not recognized");
    }
    let fileTypeMime = fileType.mime;
    let uploadBuffer: Buffer = buffer;
    if (fileType.mime.startsWith("image/")) {
      uploadBuffer = await this.processImageBuffer(uploadBuffer);
      fileTypeMime = "image/webp";
    }
    const uuid = randomUUID();
    const uploadInfo = await this.uploadFile(
      this.bucketNameDefault,
      uploadBuffer,
      uuid,
      remoteFolders ?? [BucketDefaultPaths.PRODUCT_PASSPORT_FILES],
      uploadBuffer.length,
      fileTypeMime,
    );
    const media = Media.create({
      createdByUserId,
      ownedByOrganizationId,
      title: originalFilename,
      description: originalFilename,
      mimeType: fileTypeMime,
      fileExtension: fileType.ext,
      size: uploadBuffer.length,
      originalFilename,
      uniqueProductIdentifier: null,
      dataFieldId: null,
      bucket: uploadInfo.location.bucket,
      objectName: uploadInfo.location.objectName,
      eTag: uploadInfo.info.etag,
      versionId: uploadInfo.info.versionId || this.fallbackMediaVersionId,
    });
    await this.save(media);
    return media;
  }

  async getFileStream(
    bucketName: string,
    remoteFileBaseName: string,
    remoteFolders: string[] = [],
  ) {
    const bucketExists = await this.client.bucketExists(bucketName);
    if (!bucketExists) {
      throw new Error("Bucket does not exist");
    }
    const objectName = this.buildBucketPath(remoteFileBaseName, remoteFolders);
    return await this.client.getObject(bucketName, objectName);
  }

  async getFilestreamOfProductPassport(
    dataFieldId: string,
    uniqueProductIdentifier: string,
  ) {
    const media = await this.findOneDppFileOrFail(
      dataFieldId,
      uniqueProductIdentifier,
    );
    const stream = await this.getFilestreamOfMedia(media);
    return {
      stream,
      media,
    };
  }

  async getFilestreamById(id: string) {
    const media = await this.findOneOrFail(id);
    const stream = await this.getFilestreamOfMedia(media);
    return {
      stream,
      media,
    };
  }

  async getFilestreamOfMedia(media: Media) {
    return this.getFileStream(media.bucket, media.objectName);
  }

  convertToDomain(mediaDoc: MediaDoc): Media {
    return Media.loadFromDb({
      id: mediaDoc._id,
      ownedByOrganizationId: mediaDoc.ownedByOrganizationId,
      createdByUserId: mediaDoc.createdByUserId,
      title: mediaDoc.title,
      description: mediaDoc.description,
      mimeType: mediaDoc.mimeType,
      fileExtension: mediaDoc.fileExtension,
      size: mediaDoc.size,
      originalFilename: mediaDoc.originalFilename,
      createdAt: mediaDoc.createdAt,
      updatedAt: mediaDoc.updatedAt,
      uniqueProductIdentifier: mediaDoc.uniqueProductIdentifier,
      dataFieldId: mediaDoc.dataFieldId,
      bucket: mediaDoc.bucket,
      objectName: mediaDoc.objectName,
      eTag: mediaDoc.eTag,
      versionId: mediaDoc.versionId,
    });
  }

  async save(media: Media) {
    const dataModelDoc = await this.mediaDoc.findOneAndUpdate(
      { _id: media.id },
      {
        ownedByOrganizationId: media.ownedByOrganizationId,
        createdByUserId: media.createdByUserId,
        title: media.title,
        description: media.description,
        mimeType: media.mimeType,
        fileExtension: media.fileExtension,
        size: media.size,
        originalFilename: media.originalFilename,
        uniqueProductIdentifier: media.uniqueProductIdentifier,
        dataFieldId: media.dataFieldId,
        bucket: media.bucket,
        objectName: media.objectName,
        eTag: media.eTag,
        versionId: media.versionId,
        createdAt: media.createdAt,
        updatedAt: new Date(Date.now()),
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );
    return this.convertToDomain(dataModelDoc);
  }

  async findOneOrFail(id: string) {
    const mediaDocument = await this.mediaDoc.findById(id);
    if (!mediaDocument) {
      throw new NotFoundInDatabaseException(Media.name);
    }
    return this.convertToDomain(mediaDocument);
  }

  async findOneDppFileOrFail(
    dataFieldId: string,
    uniqueProductIdentifier: string,
  ) {
    const mediaDocuments = await this.mediaDoc.find({
      dataFieldId,
      uniqueProductIdentifier,
    });
    if (mediaDocuments.length === 0) {
      throw new NotFoundInDatabaseException(Media.name);
    }
    return this.convertToDomain(mediaDocuments[0]); // Assuming there's only one match
  }

  async findAll() {
    const mediaDocuments = await this.mediaDoc.find();
    return mediaDocuments.map(mediaDocument =>
      this.convertToDomain(mediaDocument),
    );
  }

  async removeById(id: string) {
    await this.mediaDoc.deleteOne({ _id: id });
  }

  async findAllByOrganizationId(organizationId: string) {
    const mediaDocuments = await this.mediaDoc.find(
      { ownedByOrganizationId: organizationId },
      {
        _id: true,
        ownedByOrganizationId: true,
        createdByUserId: true,
        title: true,
        description: true,
        mimeType: true,
        fileExtension: true,
        size: true,
        bucket: true,
        objectName: true,
        eTag: true,
        versionId: true,
        createdAt: true,
        updatedAt: true,
        uniqueProductIdentifier: true,
        dataFieldId: true,
        originalFilename: true,
      },
    );
    return mediaDocuments.map(mediaDocument =>
      this.convertToDomain(mediaDocument),
    );
  }

  /**
   * Calculates the total storage usage for an organization.
   * @param organizationId The organization ID
   * @returns The total storage usage in bytes
   */
  async calculateOrganizationStorageUsage(organizationId: string): Promise<number> {
    const result = await this.mediaDoc.aggregate([
      {
        $match: { ownedByOrganizationId: organizationId },
      },
      {
        $group: {
          _id: null,
          totalSize: { $sum: "$size" },
        },
      },
    ]);
    return result.length > 0 ? result[0].totalSize : 0;
  }
}
