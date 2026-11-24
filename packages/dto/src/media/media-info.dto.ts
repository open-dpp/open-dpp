import { z } from "zod";
import { PagingMetadataDtoSchema } from "../shared/pagination.dto";

/** The most media one page of the organization's media can hold, and its size when none is asked for. */
export const MEDIA_INFO_PAGE_MAX_SIZE = 100;

/** What the backend stores about a media file. The content is served by the download endpoints. */
export const MediaInfoDtoSchema = z.object({
  id: z.string(),
  ownedByOrganizationId: z.string(),
  createdByUserId: z.string(),
  title: z.string(),
  description: z.string(),
  mimeType: z.string(),
  fileExtension: z.string(),
  size: z.number(),
  originalFilename: z.string(),
  // Set for a file uploaded to a field of a product passport, absent or null for any other file
  uniqueProductIdentifier: z.string().nullish(),
  dataFieldId: z.string().nullish(),
  bucket: z.string(),
  objectName: z.string(),
  eTag: z.string(),
  versionId: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type MediaInfoDto = z.infer<typeof MediaInfoDtoSchema>;

export const MediaInfoPaginationDtoSchema = z.object({
  ...PagingMetadataDtoSchema.shape,
  result: MediaInfoDtoSchema.array(),
});

export type MediaInfoPaginationDto = z.infer<typeof MediaInfoPaginationDtoSchema>;
