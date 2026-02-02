import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { Organization } from "../../domain/organization";
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

  async save(organization: Organization, headers: Record<string, string>): Promise<void> {
    try {
      await (this.auth.api as any).createOrganization({
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

  async findOneById(id: string): Promise<Organization | null> {
    const document = await this.organizationModel.findById(id);
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
}
