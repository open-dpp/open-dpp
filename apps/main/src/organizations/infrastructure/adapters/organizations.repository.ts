import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Organization } from "../../domain/organization";
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
    await this.organizationModel.findByIdAndUpdate(
      organization.id,
      persistenceModel,
      { upsert: true },
    );
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
