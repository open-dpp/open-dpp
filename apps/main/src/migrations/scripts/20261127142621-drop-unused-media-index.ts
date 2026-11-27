import type { Connection } from "mongoose";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { extractMongoErrorCode } from "../../lib/mongo-errors";
import { Migration } from "../domain/migration";

const MEDIA_COLLECTION = "media";
/** The name Mongoose gave the index it built for `{ organizationName: 1, sectors: 1 }`. */
const UNUSED_INDEX = "organizationName_1_sectors_1";

const MONGO_NAMESPACE_NOT_FOUND_ERROR_CODE = 26;
const MONGO_INDEX_NOT_FOUND_ERROR_CODE = 27;
/** What MongoDB answers when the collection or the index is not there: nothing is left to drop. */
const NOTHING_TO_DROP_ERROR_CODES: ReadonlyArray<number | undefined> = [
  MONGO_NAMESPACE_NOT_FOUND_ERROR_CODE,
  MONGO_INDEX_NOT_FOUND_ERROR_CODE,
];

/**
 * #1236: the media schema declared an index on `organizationName` and `sectors`. No media has
 * these fields and no query asks for them, so the index only cost a write on every upload.
 *
 * Mongoose builds the indexes a schema declares at startup, but never drops one the schema no
 * longer declares. Removing the declaration alone would leave the index in every existing
 * database, so this migration drops it.
 *
 * The previous release reads the same data without the index. Started again, it builds the
 * index anew, which does no harm.
 */
@Injectable()
export class DropUnusedMediaIndexMigration implements Migration {
  readonly id = "20261127142621-drop-unused-media-index";
  private readonly logger = new Logger(DropUnusedMediaIndexMigration.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    try {
      await this.connection.collection(MEDIA_COLLECTION).dropIndex(UNUSED_INDEX);
      this.logger.log(`Dropped the unused index ${UNUSED_INDEX} of the media collection`);
    } catch (error) {
      if (!NOTHING_TO_DROP_ERROR_CODES.includes(extractMongoErrorCode(error))) {
        throw error;
      }
      this.logger.log(`The media collection has no index ${UNUSED_INDEX}, nothing to drop`);
    }
  }
}
