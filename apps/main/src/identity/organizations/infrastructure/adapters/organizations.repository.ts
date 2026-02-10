import type { Auth } from "better-auth";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Organization as BetterAuthOrganizationSchema } from "better-auth/plugins/organization";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Organization, OrganizationUpdateProps } from "../../domain/organization";
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

  async update(organizationId: string, data: OrganizationUpdateProps, headers: Record<string, string>): Promise<Organization | null> {
    const organization = await this.findOneById(organizationId);
    if (!organization) {
      throw new NotFoundException();
    }
    console.log(data, organization);
    try {
      await (this.auth.api as any).updateOrganization({
        headers,
        body: {
          data: {
            name: data.name,
            slug: organization.slug,
            logo: data.logo ?? undefined,
            metadata: organization.metadata,
          },
          organizationId,
        },
      });
      return this.findOneById(organizationId);
    }
    catch (error) {
      console.log(error);
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
