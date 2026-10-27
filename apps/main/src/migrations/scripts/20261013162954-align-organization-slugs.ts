import type { Connection } from "mongoose";
import { Injectable, Logger } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Migration } from "../domain/migration";

/**
 * #852: every organization's `slug` must equal its id. Organizations created before that change
 * carry a free-text slug.
 *
 * Writes to the raw collection: the domain update path goes through better-auth's
 * `updateOrganization`, which needs the session of an organization member — nothing of the
 * kind exists at bootstrap.
 */
@Injectable()
export class AlignOrganizationSlugsMigration implements Migration {
  readonly id = "20261013162954-align-organization-slugs";
  private readonly logger = new Logger(AlignOrganizationSlugsMigration.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async up(): Promise<void> {
    const result = await this.connection
      .collection("organization")
      .updateMany({ $expr: { $ne: ["$slug", { $toString: "$_id" }] } }, [
        { $set: { slug: { $toString: "$_id" } } },
      ]);
    this.logger.log(`Aligned the slug of ${result.modifiedCount} organization(s) with their id`);
  }
}
