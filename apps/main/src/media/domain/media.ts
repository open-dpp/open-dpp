import { randomUUID } from 'node:crypto'

interface MediaCreationProps {
  ownedByOrganizationId: string
  createdByUserId: string
  title: string
  description: string
  mimeType: string
  fileExtension: string
  size: number
  originalFilename: string
  uniqueProductIdentifier: string | null
  dataFieldId: string | null
  bucket: string
  objectName: string
  eTag: string
  versionId: string
}
export type MediaProps = MediaCreationProps & {
  id: string
  createdAt?: Date
  updatedAt?: Date
}

export class Media {
  private constructor(
    public readonly id: string,
    public readonly ownedByOrganizationId: string,
    public readonly createdByUserId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly mimeType: string,
    public readonly fileExtension: string,
    public readonly size: number,
    public readonly originalFilename: string,
    public readonly uniqueProductIdentifier: string | null,
    public readonly dataFieldId: string | null,
    public readonly bucket: string,
    public readonly objectName: string,
    public readonly eTag: string,
    public readonly versionId: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(data: MediaCreationProps): Media {
    const now = new Date(Date.now())
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
    )
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
    )
  }
}
