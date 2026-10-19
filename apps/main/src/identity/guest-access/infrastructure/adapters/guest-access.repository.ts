import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { Model } from "mongoose";
import { GuestAccess } from "../../domain/guest-access";
import { GuestAccessMapper, GuestAccessPersistence } from "../mappers/guest-access.mapper";
import {
  GuestAccessDocument,
  GuestAccess as GuestAccessSchemaClass,
  GuestAccessSchemaVersion,
} from "../schemas/guest-access.schema";

export interface GuestAccessFilter {
  /** Only accesses accepted by this user. */
  acceptedByUserId?: string;
  /** Only accesses invited with this email (compared case-insensitively). */
  email?: string;
  /** `false`: not revoked, `true`: revoked only. Omitted: both. */
  revoked?: boolean;
}

@Injectable()
export class GuestAccessRepository {
  constructor(
    @InjectModel(GuestAccessSchemaClass.name)
    private readonly model: Model<GuestAccessDocument>,
  ) {}

  async save(guestAccess: GuestAccess): Promise<GuestAccess> {
    const persistence = GuestAccessMapper.toPersistence(guestAccess);
    const document =
      (await this.model.findOne({ _id: { $eq: guestAccess.id } })) ??
      new this.model({ _id: guestAccess.id });
    // overwrite drops fields that are no longer set, so the document always mirrors the entity
    document.overwrite({ ...persistence, _schemaVersion: GuestAccessSchemaVersion.v1_0_0 });
    const saved = await document.save();
    return GuestAccessMapper.toDomain(saved.toObject<GuestAccessPersistence>());
  }

  async findOneById(id: string): Promise<GuestAccess | null> {
    const document = await this.model
      .findOne({ _id: { $eq: id } })
      .lean<GuestAccessPersistence>()
      .exec();
    return document ? GuestAccessMapper.toDomain(document) : null;
  }

  async findOneByIdOrFail(id: string): Promise<GuestAccess> {
    const guestAccess = await this.findOneById(id);
    if (!guestAccess) {
      throw new NotFoundInDatabaseException(GuestAccessSchemaClass.name);
    }
    return guestAccess;
  }

  /**
   * Guest accesses of an organization, oldest first. Without a filter all of them are returned,
   * including pending and revoked ones. The domain decides with `isActiveFor` whether an access
   * actually grants anything, so filters only narrow the candidates.
   */
  async findAllByOrganizationId(
    organizationId: string,
    filter: GuestAccessFilter = {},
  ): Promise<GuestAccess[]> {
    const query: Record<string, unknown> = { organizationId: { $eq: organizationId } };
    if (filter.acceptedByUserId !== undefined) {
      query.acceptedByUserId = { $eq: filter.acceptedByUserId };
    }
    if (filter.email !== undefined) {
      query.email = { $eq: filter.email.trim().toLowerCase() };
    }
    if (filter.revoked !== undefined) {
      query.revokedAt = { $exists: filter.revoked };
    }
    const documents = await this.model
      .find(query)
      .sort({ createdAt: 1, _id: 1 })
      .lean<GuestAccessPersistence[]>()
      .exec();
    return documents.map((d) => GuestAccessMapper.toDomain(d));
  }
}
