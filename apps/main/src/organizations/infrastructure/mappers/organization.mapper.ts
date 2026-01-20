import { Organization, OrganizationDbProps } from "../../domain/organization";
import { OrganizationDocument, Organization as OrganizationSchema } from "../schemas/organization.schema";

export class OrganizationMapper {
  static toDomain(document: OrganizationDocument): Organization {
    const props: OrganizationDbProps = {
      id: document._id,
      name: document.name,
      slug: document.slug,
      logo: document.logo,
      metadata: document.metadata,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt as Date,
    };
    return Organization.loadFromDb(props);
  }

  static toPersistence(entity: Organization): OrganizationSchema {
    return {
      _id: entity.id,
      name: entity.name,
      slug: entity.slug,
      logo: entity.logo ?? undefined,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as OrganizationSchema;
  }
}
