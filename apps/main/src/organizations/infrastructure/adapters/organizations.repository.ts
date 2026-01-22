import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "../../domain/organization";
import { DuplicateOrganizationSlugError } from "../../domain/organization.errors";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { OrganizationMapper } from "../mappers/organization.mapper";
import { Organization as OrganizationSchema } from "../schemas/organization.schema";

@Injectable()
export class OrganizationsRepository implements OrganizationsRepositoryPort {
  constructor(
    @InjectModel(OrganizationSchema.name)
    private readonly organizationModel: Model<OrganizationSchema>,
  ) { }

  async save(organization: Organization): Promise<void> {
    const persistenceModel = OrganizationMapper.toPersistence(organization);
    // Use findByIdAndUpdate with upsert to handle both create and update
    try {
      await this.organizationModel.findByIdAndUpdate(
        organization.id,
        persistenceModel,
        { upsert: true },
      );
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
