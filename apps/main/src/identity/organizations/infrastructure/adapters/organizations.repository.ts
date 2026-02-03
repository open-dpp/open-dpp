import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organization as BetterAuthOrganizationSchema } from "better-auth/plugins/organization";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Organization, OrganizationCreateProps } from "../../domain/organization";
import { DuplicateOrganizationSlugError } from "../../domain/organization.errors";
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

  async create(organization: Organization, headers: Record<string, string>): Promise<BetterAuthOrganizationSchema> {
    try {
      return (this.auth.api as any).createOrganization({
        headers,
        body: {
          name: organization.name,
          slug: organization.slug,
          logo: organization.logo,
          metadata: JSON.stringify(organization.metadata || {}),
        },
      });
    }
    catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.slug) {
        throw new DuplicateOrganizationSlugError(organization.slug);
      }
      throw error;
    }
  }

  async update(organizationId: string, data: OrganizationCreateProps, headers: Record<string, string>): Promise<Organization | null> {
    try {
      await (this.auth.api as any).updateOrganization({
        headers,
        body: {
          name: data.name,
          slug: data.slug,
          logo: data.logo,
          metadata: JSON.stringify(data.metadata || {}),
        },
        organizationId,
      });
      return this.findOneById(organizationId);
    }
    catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.slug) {
        throw new DuplicateOrganizationSlugError(data.slug);
      }
      throw error;
    }
  }

  async findOneById(id: string): Promise<Organization | null> {
    // Workaround: findById, findOne, and $eq queries all fail despite find() returning the document.
    // This is likely due to how Mongoose handles the string _id type in queries.
    // Using find() + filter approach as the reliable workaround.
    const allOrgs = await this.organizationModel.find().exec();
    const document = allOrgs.find(o => o._id === id);
    if (!document)
      return null;
    return OrganizationMapper.toDomain(document);
  }

  async findOneBySlug(slug: string): Promise<Organization | null> {
    const document = await this.organizationModel.findOne({ slug });
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
