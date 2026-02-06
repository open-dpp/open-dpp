import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organization as BetterAuthOrganizationSchema } from "better-auth/plugins/organization";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Organization, OrganizationCreateProps } from "../../domain/organization";
import { OrganizationMapper } from "../mappers/organization.mapper";
import { Organization as OrganizationSchema } from "../schemas/organization.schema";

@Injectable()
export class OrganizationsRepository {
  constructor(
    @InjectModel(OrganizationSchema.name)
    private readonly organizationModel: Model<OrganizationSchema>,
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  async findManyByMember(headers: Record<string, string>): Promise<Organization[]> {
    const result = await (this.auth.api as any).listOrganizations({
      headers,
    });

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map((org: any) => OrganizationMapper.toDomain(org));
  }

  async create(organization: Organization, headers: Record<string, string>): Promise<BetterAuthOrganizationSchema | null> {
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
      return result;
    }
    catch {
      return null;
    }
  }

  async update(organizationId: string, data: OrganizationCreateProps, headers: Record<string, string>): Promise<Organization | null> {
    try {
      await (this.auth.api as any).updateOrganization({
        headers,
        body: {
          name: data.name,
          slug: data.slug,
          logo: data.logo ?? undefined,
          metadata: JSON.stringify(data.metadata || {}),
        },
        organizationId,
      });
      return this.findOneById(organizationId);
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

  async getOrganizationDataForPermalink(organizationId: string): Promise<{ name: string; image: string } | null> {
    const organization = await this.organizationModel.findById(organizationId);
    if (!organization)
      return null;
    return {
      name: organization.name ?? "",
      image: organization.logo ?? "",
    };
  }

  async getAllOrganizations() {
    const organizations = await this.organizationModel
      .find()
      .limit(100);
    return organizations.map(org => OrganizationMapper.toDomain(org));
  }

  async inviteMember(
    email: string,
    role: string,
    organizationId: string,
    headers?: Record<string, string> | Headers,
  ): Promise<void> {
    await (this.auth.api as any).createInvitation({
      headers,
      body: {
        email,
        role,
        organizationId,
      },
    });
  }
}
