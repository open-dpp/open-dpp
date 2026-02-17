import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import type { BetterAuthHeaders } from "../../../auth/domain/better-auth-headers";
import { Organization } from "../../domain/organization";
import { OrganizationMapper } from "../mappers/organization.mapper";
import { Organization as OrganizationSchema } from "../schemas/organization.schema";

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(OrganizationSchema.name)
    private readonly organizationModel: Model<OrganizationSchema>,
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  async findManyByMember(headers: BetterAuthHeaders): Promise<Organization[]> {
    const result = await (this.auth.api as any).listOrganizations({
      headers,
    });

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map((org: any) => OrganizationMapper.toDomainFromBetterAuth(org));
  }

  async create(organization: Organization, headers: BetterAuthHeaders): Promise<Organization | null> {
    try {
      const result = await (this.auth.api as any).createOrganization({
        headers,
        body: {
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo ?? undefined,
          metadata: JSON.stringify(organization.metadata || {}),
        },
      });
      if (!result) {
        return null;
      }
      return OrganizationMapper.toDomainFromBetterAuth(result);
    }
    catch {
      return null;
    }
  }

  async update(organization: Organization, headers: BetterAuthHeaders): Promise<Organization | null> {
    try {
      await (this.auth.api as any).updateOrganization({
        headers,
        body: {
          data: {
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo ?? undefined,
            metadata: organization.metadata,
          },
          organizationId: organization.id,
        },
      });
      return this.findOneById(organization.id);
    }
    catch {
      return null;
    }
  }

  async findOneById(id: string): Promise<Organization | null> {
    const document = await this.organizationModel.findOne({ _id: new ObjectId(id) });
    if (!document)
      return null;
    return OrganizationMapper.toDomain(document);
  }

  async findOneBySlug(slug: string): Promise<Organization | null> {
    // Ensure slug is a safe primitive value before using it in a query
    if (typeof slug !== "string" || slug.trim().length === 0) {
      return null;
    }

    const document = await this.organizationModel.findOne({ slug: { $eq: slug } });
    if (!document)
      return null;
    return OrganizationMapper.toDomain(document);
  }

  async findManyByIds(ids: string[]): Promise<Organization[]> {
    const documents = await this.organizationModel.find({ _id: { $in: ids } });
    return documents.map(OrganizationMapper.toDomain);
  }

  async getAllOrganizations() {
    const organizations = await this.organizationModel
      .find()
      .limit(100);
    return organizations.map(org => OrganizationMapper.toDomain(org));
  }
}
