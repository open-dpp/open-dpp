import { randomUUID } from "node:crypto";

interface MediaCreationProps {
  ownedByOrganizationId: string;
  createdByUserId: string;
  title: string;
  description: string;
  mimeType: string;
  fileExtension: string;
  size: number;
  originalFilename: string;
  uniqueProductIdentifier: string | null;
  dataFieldId: string | null;
  bucket: string;
  objectName: string;
  eTag: string;
  versionId: string;
}
export type MediaProps = MediaCreationProps & {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export class Media {
  public readonly id: string;
  public readonly ownedByOrganizationId: string;
  public readonly createdByUserId: string;
  public readonly title: string;
  public readonly description: string;
  public readonly mimeType: string;
  public readonly fileExtension: string;
  public readonly size: number;
  public readonly originalFilename: string;
  public readonly uniqueProductIdentifier: string | null;
  public readonly dataFieldId: string | null;
  public readonly bucket: string;
  public readonly objectName: string;
  public readonly eTag: string;
  public readonly versionId: string;
  public readonly createdAt?: Date;
  public readonly updatedAt?: Date;

  private constructor(
    id: string,
    ownedByOrganizationId: string,
    createdByUserId: string,
    title: string,
    description: string,
    mimeType: string,
    fileExtension: string,
    size: number,
    originalFilename: string,
    uniqueProductIdentifier: string | null,
    dataFieldId: string | null,
    bucket: string,
    objectName: string,
    eTag: string,
    versionId: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    this.id = id;
    this.ownedByOrganizationId = ownedByOrganizationId;
    this.createdByUserId = createdByUserId;
    this.title = title;
    this.description = description;
    this.mimeType = mimeType;
    this.fileExtension = fileExtension;
    this.size = size;
    this.originalFilename = originalFilename;
    this.uniqueProductIdentifier = uniqueProductIdentifier;
    this.dataFieldId = dataFieldId;
    this.bucket = bucket;
    this.objectName = objectName;
    this.eTag = eTag;
    this.versionId = versionId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static create(data: MediaCreationProps): Media {
    const now = new Date(Date.now());
    return new Media(
      randomUUID(),
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.title,
      data.description,
      data.mimeType,
      data.fileExtension,
      data.size,
      data.originalFilename,
      data.uniqueProductIdentifier,
      data.dataFieldId,
      data.bucket,
      data.objectName,
      data.eTag,
      data.versionId,
      now,
      now,
    );
  }

  static loadFromDb(data: MediaProps): Media {
    return new Media(
      data.id,
      data.ownedByOrganizationId,
      data.createdByUserId,
      data.title,
      data.description,
      data.mimeType,
      data.fileExtension,
      data.size,
      data.originalFilename,
      data.uniqueProductIdentifier,
      data.dataFieldId,
      data.bucket,
      data.objectName,
      data.eTag,
      data.versionId,
      data.createdAt,
      data.updatedAt,
    );
  }

  toPlain() {
    return {
      id: this.id,
      ownedByOrganizationId: this.ownedByOrganizationId,
      createdByUserId: this.createdByUserId,
      title: this.title,
      description: this.description,
      mimeType: this.mimeType,
      fileExtension: this.fileExtension,
      size: this.size,
      originalFilename: this.originalFilename,
      uniqueProductIdentifier: this.uniqueProductIdentifier,
      dataFieldId: this.dataFieldId,
      bucket: this.bucket,
      objectName: this.objectName,
      eTag: this.eTag,
      versionId: this.versionId,
      createdAt: this.createdAt?.toISOString(),
      updatedAt: this.updatedAt?.toISOString(),
    };
  }
}
