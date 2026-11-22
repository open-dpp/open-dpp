import { randomUUID } from "node:crypto";

/** What describes the stored file itself. All of it changes when the file is replaced. */
export interface MediaFileProps {
  title: string;
  description: string;
  mimeType: string;
  fileExtension: string;
  size: number;
  originalFilename: string;
  bucket: string;
  objectName: string;
  eTag: string;
  versionId: string;
}

interface MediaCreationProps extends MediaFileProps {
  ownedByOrganizationId: string;
  createdByUserId: string;
  uniqueProductIdentifier: string | null;
  dataFieldId: string | null;
}

export type MediaProps = MediaCreationProps & {
  id: string;
  /** Missing on media stored before updates were recorded. */
  updatedByUserId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type MediaState = MediaProps & { updatedByUserId: string | null };

export class Media {
  public readonly id: string;
  public readonly ownedByOrganizationId: string;
  public readonly createdByUserId: string;
  /** The user who last replaced the file, or null if it was never replaced. */
  public readonly updatedByUserId: string | null;
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

  private constructor(state: MediaState) {
    this.id = state.id;
    this.ownedByOrganizationId = state.ownedByOrganizationId;
    this.createdByUserId = state.createdByUserId;
    this.updatedByUserId = state.updatedByUserId;
    this.title = state.title;
    this.description = state.description;
    this.mimeType = state.mimeType;
    this.fileExtension = state.fileExtension;
    this.size = state.size;
    this.originalFilename = state.originalFilename;
    this.uniqueProductIdentifier = state.uniqueProductIdentifier;
    this.dataFieldId = state.dataFieldId;
    this.bucket = state.bucket;
    this.objectName = state.objectName;
    this.eTag = state.eTag;
    this.versionId = state.versionId;
    this.createdAt = state.createdAt;
    this.updatedAt = state.updatedAt;
  }

  static create(data: MediaCreationProps): Media {
    const now = new Date(Date.now());
    return new Media({
      ...data,
      id: randomUUID(),
      updatedByUserId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static loadFromDb(data: MediaProps): Media {
    return new Media({ ...data, updatedByUserId: data.updatedByUserId ?? null });
  }

  /**
   * The same media with another file: its id, creator, organization and passport field stay,
   * everything that describes the file is replaced.
   */
  withReplacedFile(file: MediaFileProps, replacedByUserId: string): Media {
    return new Media({
      ...this,
      ...file,
      updatedByUserId: replacedByUserId,
      updatedAt: new Date(Date.now()),
    });
  }
}
