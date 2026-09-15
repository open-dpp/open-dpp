import type { Auth } from "better-auth";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Organization } from "../../domain/organization";
import { OrganizationMapper } from "../mappers/organization.mapper";
import { Organization as OrganizationSchema } from "../schemas/organization.schema";

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(OrganizationSchema.name)
    private readonly organizationModel: Model<OrganizationSchema>,
    @Inject(AUTH) private readonly auth: Auth,
  ) {}

  async findManyByMember(headers: BetterAuthHeaders): Promise<Organization[]> {
    const result = await (this.auth.api as any).listOrganizations({
      headers,
    });

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map((org: any) => OrganizationMapper.toDomainFromBetterAuth(org));
  }

  async create(
    organization: Organization,
    headers: BetterAuthHeaders,
  ): Promise<Organization | null> {
    const result = await (this.auth.api as any).createOrganization({
      headers,
      body: {
        name: organization.name,
        // Placeholder only: better-auth requires a unique slug in the body, but the
        // creation hook (assignOrganizationIdAsSlug) replaces both id and slug on persist.
        slug: organization.slug,
        logo: organization.logo ?? undefined,
        metadata: organization.metadata || {},
      },
    });
    if (!result) {
      return null;
    }
    return OrganizationMapper.toDomainFromBetterAuth(result);
  }

  async update(
    organization: Organization,
    headers: BetterAuthHeaders,
  ): Promise<Organization | null> {
    await (this.auth.api as any).updateOrganization({
      headers,
      body: {
        data: {
          name: organization.name,
          logo: organization.logo ?? "",
          metadata: organization.metadata,
        },
        organizationId: organization.id,
      },
    });
    return this.findOneById(organization.id);
  }

  async findOneById(id: string): Promise<Organization | null> {
    const document = await this.organizationModel.findOne({ _id: new ObjectId(id) });
    if (!document) return null;
    return OrganizationMapper.toDomain(document);
  }

  async findManyByIds(ids: string[]): Promise<Organization[]> {
    const documents = await this.organizationModel.find({
      _id: { $in: ids.map((id) => new ObjectId(id)) },
    });
    return documents.map(OrganizationMapper.toDomain);
  }

  /**
   * Ids of every organization, unbounded and without hydrating the documents —
   * for maintenance passes that have to touch each organization exactly once.
   */
  async findAllIds(): Promise<string[]> {
    const documents = await this.organizationModel.find({}, { _id: 1 }).lean();
    return documents.map((document) => document._id.toString());
  }

  /**
   * Data migration (#852): every organization's `slug` must equal its id. Runs on every
   * bootstrap (see OrganizationSlugInitializerService), is idempotent and costs one round
   * trip: only documents whose slug still differs are touched. Returns the number aligned.
   *
   * Deliberate exception to "no field-level $set in repositories": the domain update path
   * ({@link update}) goes through better-auth's `updateOrganization`, which requires a session
   * of an organization member — nothing of the kind exists at bootstrap. Keep this the only
   * such write in the module.
   */
  async alignSlugsWithIds(): Promise<number> {
    const result = await this.organizationModel.updateMany(
      { $expr: { $ne: ["$slug", { $toString: "$_id" }] } },
      [{ $set: { slug: { $toString: "$_id" } } }],
      { updatePipeline: true },
    );
    return result.modifiedCount;
  }

  async getAllOrganizations() {
    const organizations = await this.organizationModel.find().limit(100);
    return organizations.map((org) => OrganizationMapper.toDomain(org));
  }
}
