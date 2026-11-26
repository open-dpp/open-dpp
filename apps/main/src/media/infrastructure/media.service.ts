import type { Model } from "mongoose";
import type { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { MEDIA_UPLOAD_MIME_TYPES } from "@open-dpp/dto";
import { EnvService } from "@open-dpp/env";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import _ from "lodash";
import { S3Error, Client as S3Client } from "minio";
import type { MediaFileProps } from "../domain/media";
import type { ProcessedMediaUpload } from "./media-upload/media-upload-processor";
import { isDuplicateKeyErrorOnField } from "../../lib/mongo-errors";
import { Media } from "../domain/media";
import { detectMediaProcessor } from "./media-upload/media-upload-processor";
import { MediaDoc } from "./media.schema";

export const BucketDefaultPaths = {
  PRODUCT_PASSPORT_FILES: "product-passport-files",
  ORGANIZATION_PROFILE_PICTURES: "organization-profile-pictures",
} as const;

/** S3 reports a missing object as `NoSuchKey`, or as `NotFound` when the response has no body. */
const MISSING_OBJECT_ERROR_CODES: ReadonlySet<string> = new Set(["NoSuchKey", "NotFound"]);

function isMissingObjectError(error: unknown) {
  return error instanceof S3Error && MISSING_OBJECT_ERROR_CODES.has(error.code ?? "");
}

/** Where an object is stored in the bucket. */
interface StoredObject {
  readonly bucket: string;
  readonly objectName: string;
}

/** The same for every media that points to one object. */
function objectKey({ bucket, objectName }: StoredObject) {
  return `${bucket}/${objectName}`;
}

/** A file stored in the bucket for a passport field, before a media holds it. */
interface PassportFieldUpload {
  readonly dataFieldId: string;
  readonly uniqueProductIdentifier: string;
  readonly uploadedByUserId: string;
  readonly ownedByOrganizationId: string;
  /** Also tells where the object is stored. */
  readonly file: MediaFileProps;
}

/** The media that holds an upload, and the media of the field it was saved over. */
interface SavedPassportFieldUpload {
  readonly media: Media;
  readonly replaced: readonly Media[];
}

/** The unique index of the passport field rejected a second media for the field. */
function isDuplicatePassportFieldError(error: unknown) {
  return isDuplicateKeyErrorOnField(error, "uniqueProductIdentifier");
}

export interface UploadMediaOptions {
  /** Types the file may have; detected from its content. Defaults to the media upload types. */
  readonly allowedMimeTypes?: readonly string[];
  /** Folders inside the bucket. Defaults to the product passport files folder. */
  readonly remoteFolders?: string[];
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly client: S3Client;
  private readonly bucketNameDefault: string;
  private readonly bucketNameProfilePictures: string;
  private readonly pathDelimiter = "/";
  private readonly fallbackMediaVersionId = "unversioned";
  private readonly logger = new Logger(MediaService.name);

  private readonly configService: EnvService;
  private mediaDoc: Model<MediaDoc>;

  constructor(
    configService: EnvService,
    @InjectModel(MediaDoc.name)
    mediaDoc: Model<MediaDoc>,
  ) {
    this.configService = configService;
    this.mediaDoc = mediaDoc;
    this.client = new S3Client({
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
    const uploadInfo = await this.client.putObject(bucketName, objectName, buffer, size, {
      "Content-Type": mimeType,
    });
    return {
      info: uploadInfo,
      location: {
        bucket: bucketName,
        objectName,
      },
    };
  }

  async deleteFileById(id: string) {
    const object = await this.findOneOrFail(id);

    try {
      await this.client.removeObject(object.bucket, object.objectName);
    } catch (error) {
      this.logger.error(`Failed to remove the stored file of media ${id}`, error);
      return new Error("failed to delete media object");
    }

    return this.removeById(id);
  }

  /** How a media describes a file that was just processed and stored in the bucket. */
  private describeStoredFile(
    originalFilename: string,
    processed: ProcessedMediaUpload,
    stored: Awaited<ReturnType<MediaService["uploadFile"]>>,
  ): MediaFileProps {
    return {
      title: originalFilename,
      description: originalFilename,
      mimeType: processed.mimeType,
      fileExtension: processed.fileExtension,
      size: processed.buffer.length,
      originalFilename,
      bucket: stored.location.bucket,
      objectName: stored.location.objectName,
      eTag: stored.info.etag,
      versionId: stored.info.versionId || this.fallbackMediaVersionId,
    };
  }

  /**
   * Removes objects that no media points to any more. A failure is only logged: it leaves an
   * unused object in the bucket, while every media still points to a file that exists.
   */
  private async removeUnusedObjects(objects: readonly StoredObject[]) {
    const unique = _.uniqBy(objects, objectKey);
    await Promise.all(
      unique.map(async ({ bucket, objectName }) => {
        try {
          await this.client.removeObject(bucket, objectName);
        } catch (error) {
          this.logger.error(`Failed to remove unused object ${bucket}/${objectName}`, error);
        }
      }),
    );
  }

  /**
   * Removes the object of a media whose save failed. A save can fail after the media was written,
   * so the object stays if the media points to it. It also stays if the media cannot be read:
   * an unused object is better than a media that points to a missing file.
   */
  private async removeObjectOfFailedSave(mediaId: string, object: StoredObject) {
    const isReferenced = await this.mediaReferencesObject(mediaId, object).catch(
      (error: unknown) => {
        this.logger.error(
          `Failed to read media ${mediaId} after its save failed, keeping object ${object.bucket}/${object.objectName}`,
          error,
        );
        return true;
      },
    );
    if (!isReferenced) {
      await this.removeUnusedObjects([object]);
    }
  }

  /**
   * Removes the further media of a passport field. It runs after the replacement is saved, so a
   * failure is only logged. Returns the media that may still exist.
   */
  private async removeDuplicateMedia(duplicates: readonly Media[]): Promise<readonly Media[]> {
    if (duplicates.length === 0) {
      return [];
    }
    const ids = duplicates.map((duplicate) => duplicate.id);
    try {
      await this.mediaDoc.deleteMany({ _id: { $in: ids } });
      return [];
    } catch (error) {
      this.logger.error(
        `Failed to remove further media ${ids.join(", ")} of a passport field, keeping their objects`,
        error,
      );
      return duplicates;
    }
  }

  private async mediaReferencesObject(mediaId: string, object: StoredObject) {
    const mediaDocument = await this.mediaDoc.findById(mediaId, { bucket: true, objectName: true });
    return (
      mediaDocument?.bucket === object.bucket && mediaDocument.objectName === object.objectName
    );
  }

  /**
   * Stores the file of a passport field. If the field already has a media, its file is replaced
   * and the media stays the same one; the organization is only used for a new media. Concurrent
   * first uploads to a field end with one media as well, and all of them return its id.
   */
  async uploadFileOfProductPassport(
    originalFilename: string,
    buffer: Buffer,
    dataFieldId: string,
    uniqueProductIdentifier: string,
    uploadedByUserId: string,
    ownedByOrganizationId: string,
  ) {
    // Processed first: a rejected file must not touch the media it was meant to replace.
    const processor = await detectMediaProcessor(buffer);
    const processed = await processor.process(buffer, MEDIA_UPLOAD_MIME_TYPES);
    const found = await this.findDppFiles(dataFieldId, uniqueProductIdentifier);
    // Every upload gets its own object, so the file the field has now stays until the save.
    const stored = await this.uploadFile(
      this.bucketNameDefault,
      processed.buffer,
      `${dataFieldId}-${randomUUID()}`,
      [BucketDefaultPaths.PRODUCT_PASSPORT_FILES, uniqueProductIdentifier],
      processed.buffer.length,
      processed.mimeType,
    );
    const upload: PassportFieldUpload = {
      dataFieldId,
      uniqueProductIdentifier,
      uploadedByUserId,
      ownedByOrganizationId,
      file: this.describeStoredFile(originalFilename, processed, stored),
    };
    const { media, replaced } = await this.saveToPassportField(upload, found);
    await this.removeReplacedMedia(replaced);
    return media;
  }

  /** The first media found for the field with the uploaded file, or a new media. */
  private withUploadedFile(upload: PassportFieldUpload, existing: Media | undefined): Media {
    return existing
      ? existing.withReplacedFile(upload.file, upload.uploadedByUserId)
      : Media.create({
          ...upload.file,
          createdByUserId: upload.uploadedByUserId,
          ownedByOrganizationId: upload.ownedByOrganizationId,
          uniqueProductIdentifier: upload.uniqueProductIdentifier,
          dataFieldId: upload.dataFieldId,
        });
  }

  /**
   * Saves the upload into the media found for its field. Another upload can create the media of
   * the field after it was read; the unique index then rejects this one, and the upload replaces
   * the file of that media instead, once. The object is only removed when the upload fails.
   */
  private async saveToPassportField(
    upload: PassportFieldUpload,
    found: readonly Media[],
    mayRetry = true,
  ): Promise<SavedPassportFieldUpload> {
    const media = this.withUploadedFile(upload, found[0]);
    try {
      await this.save(media);
      return { media, replaced: found };
    } catch (error) {
      if (mayRetry && isDuplicatePassportFieldError(error)) {
        return this.saveToCurrentMediaOfField(upload, media.id);
      }
      await this.removeObjectOfFailedSave(media.id, upload.file);
      throw error;
    }
  }

  /**
   * Reads the field again after the index rejected the media `rejectedMediaId`, which was not
   * written, and saves the upload into the media found now.
   */
  private async saveToCurrentMediaOfField(upload: PassportFieldUpload, rejectedMediaId: string) {
    const current = await this.findDppFiles(
      upload.dataFieldId,
      upload.uniqueProductIdentifier,
    ).catch(async (error: unknown) => {
      await this.removeObjectOfFailedSave(rejectedMediaId, upload.file);
      throw error;
    });
    return this.saveToPassportField(upload, current, false);
  }

  /**
   * Removes the further media of the field and the objects of the files the upload replaced.
   * Before each upload got its own key, all media of a field shared one object. An object stays
   * while a media that may still exist points to it.
   */
  private async removeReplacedMedia(replaced: readonly Media[]) {
    // Only the media just saved stays. The unique index allows no further media of a field; they
    // remain only where the index could not be built.
    const [, ...duplicates] = replaced;
    const remaining = await this.removeDuplicateMedia(duplicates);
    await this.removeUnusedObjects(_.differenceBy(replaced, remaining, objectKey));
  }

  async uploadMedia(
    originalFilename: string,
    buffer: Buffer,
    createdByUserId: string,
    ownedByOrganizationId: string,
    options: UploadMediaOptions = {},
  ) {
    const processor = await detectMediaProcessor(buffer);
    const processed = await processor.process(
      buffer,
      options.allowedMimeTypes ?? MEDIA_UPLOAD_MIME_TYPES,
    );
    const stored = await this.uploadFile(
      this.bucketNameDefault,
      processed.buffer,
      randomUUID(),
      options.remoteFolders ?? [BucketDefaultPaths.PRODUCT_PASSPORT_FILES],
      processed.buffer.length,
      processed.mimeType,
    );
    const media = Media.create({
      ...this.describeStoredFile(originalFilename, processed, stored),
      createdByUserId,
      ownedByOrganizationId,
      uniqueProductIdentifier: null,
      dataFieldId: null,
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

  async getFilestreamOfProductPassport(dataFieldId: string, uniqueProductIdentifier: string) {
    return this.openFileOfMedia(() =>
      this.findOneDppFileOrFail(dataFieldId, uniqueProductIdentifier),
    );
  }

  async getFilestreamById(id: string) {
    return this.openFileOfMedia(() => this.findOneOrFail(id));
  }

  /**
   * A replacement removes the previous object once it is saved, so a media read just before that
   * points to an object that is gone. The media is then read once more and, if it points to
   * another object now, that one is opened.
   */
  private async openFileOfMedia(findMedia: () => Promise<Media>) {
    const media = await findMedia();
    try {
      return { stream: await this.getFilestreamOfMedia(media), media };
    } catch (error) {
      if (!isMissingObjectError(error)) {
        throw error;
      }
      const current = await findMedia();
      if (current.bucket === media.bucket && current.objectName === media.objectName) {
        throw error;
      }
      return { stream: await this.getFilestreamOfMedia(current), media: current };
    }
  }

  async getFilestreamOfMedia(media: Media) {
    return this.getFileStream(media.bucket, media.objectName);
  }

  convertToDomain(mediaDoc: MediaDoc): Media {
    return Media.loadFromDb({
      id: mediaDoc._id,
      ownedByOrganizationId: mediaDoc.ownedByOrganizationId,
      createdByUserId: mediaDoc.createdByUserId,
      updatedByUserId: mediaDoc.updatedByUserId,
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
        updatedByUserId: media.updatedByUserId,
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

  async findByIds(ids: string[]): Promise<Media[]> {
    if (ids.length === 0) {
      return [];
    }
    const docs = await this.mediaDoc.find({ _id: { $in: ids } });
    return docs.map((d) => this.convertToDomain(d));
  }

  async findOneOrFail(id: string) {
    const mediaDocument = await this.mediaDoc.findById(id);
    if (!mediaDocument) {
      throw new NotFoundInDatabaseException(Media.name);
    }
    return this.convertToDomain(mediaDocument);
  }

  /**
   * The media of a passport field. A unique index allows one at most, but a database where it
   * could not be built may hold several. They come sorted by id, so every upload keeps the same
   * one of several and every download opens that one; the migration that builds the index keeps
   * that one as well.
   */
  private async findDppFiles(dataFieldId: string, uniqueProductIdentifier: string) {
    const mediaDocuments = await this.mediaDoc.find(
      { dataFieldId, uniqueProductIdentifier },
      null,
      { sort: { _id: 1 } },
    );
    return mediaDocuments.map((mediaDocument) => this.convertToDomain(mediaDocument));
  }

  async findOneDppFileOrFail(dataFieldId: string, uniqueProductIdentifier: string) {
    const [media] = await this.findDppFiles(dataFieldId, uniqueProductIdentifier);
    if (!media) {
      throw new NotFoundInDatabaseException(Media.name);
    }
    return media;
  }

  async findAll() {
    const mediaDocuments = await this.mediaDoc.find();
    return mediaDocuments.map((mediaDocument) => this.convertToDomain(mediaDocument));
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
        updatedByUserId: true,
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
    return mediaDocuments.map((mediaDocument) => this.convertToDomain(mediaDocument));
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
