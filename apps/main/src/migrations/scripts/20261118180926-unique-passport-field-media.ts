import type { Collection, Connection } from "mongoose";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import {
  MEDIA_COLLECTION,
  PASSPORT_FIELD_MEDIA_INDEX,
} from "../../media/infrastructure/media.schema";
import { Migration } from "../domain/migration";

/** Media ids are UUID strings. */
type MediaDocument = { _id: string };

/**
 * #1143: a passport field holds one media at most, enforced by a unique index. Concurrent first
 * uploads could store several media for one field before. Of those, the one with the lowest id
 * stays: it is the one every download of the field already opened, and the one an upload kept.
 *
 * Mongoose builds the schema's indexes on its own at startup, but only once: the build fails
 * while the collection still holds several media of a field, and it is never tried again. So
 * this migration removes the further media first and then builds the index itself. Whichever of
 * the two runs first, the index ends up in place: a build that failed is made up for here, and
 * an index that is already built is left as it is. Both use the same index options.
 *
 * Writes to the raw collection. The previous release finds the one media left for each field, so
 * it can still read the data. The objects of the removed media stay in the bucket: before each
 * upload got its own object key, all media of a field shared one object, so it may still be the
 * file of the media that stays. An unused object is the fail-safe the uploads use as well, and a
 * migration does not reach S3.
 */
@Injectable()
export class UniquePassportFieldMediaMigration implements Migration {
  readonly id = "20261118180926-unique-passport-field-media";
  private readonly logger = new Logger(UniquePassportFieldMediaMigration.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    const media = this.connection.collection<MediaDocument>(MEDIA_COLLECTION);
    const removedCount = await this.removeFurtherMediaOfPassportFields(media);
    this.logger.log(`Removed ${removedCount} further media of passport fields`);
    await media.createIndex(PASSPORT_FIELD_MEDIA_INDEX.fields, PASSPORT_FIELD_MEDIA_INDEX.options);
  }

  /** Keeps the media with the lowest id of each passport field. Returns how many were removed. */
  private async removeFurtherMediaOfPassportFields(
    media: Collection<MediaDocument>,
  ): Promise<number> {
    const groups = await media
      .aggregate<{ further: string[] }>([
        { $match: PASSPORT_FIELD_MEDIA_INDEX.options.partialFilterExpression },
        {
          $group: {
            _id: {
              uniqueProductIdentifier: "$uniqueProductIdentifier",
              dataFieldId: "$dataFieldId",
            },
            kept: { $min: "$_id" },
            ids: { $push: "$_id" },
          },
        },
        {
          $project: {
            further: { $filter: { input: "$ids", cond: { $ne: ["$$this", "$kept"] } } },
          },
        },
        { $match: { "further.0": { $exists: true } } },
      ])
      .toArray();
    const furtherIds = groups.flatMap((group) => group.further);
    if (furtherIds.length === 0) {
      return 0;
    }
    const { deletedCount } = await media.deleteMany({ _id: { $in: furtherIds } });
    return deletedCount;
  }
}
