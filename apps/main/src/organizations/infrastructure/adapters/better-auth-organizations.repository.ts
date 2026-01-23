import { Inject, Injectable, Logger } from "@nestjs/common";
import { Auth } from "better-auth";
import { AUTH } from "../../../auth/auth.provider";
import { Organization, OrganizationDbProps } from "../../domain/organization";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";

@Injectable()
export class BetterAuthOrganizationsRepository implements OrganizationsRepositoryPort {
  private readonly logger = new Logger(BetterAuthOrganizationsRepository.name);
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  private toDomain(authEntity: any): Organization {
    const props: OrganizationDbProps = {
      id: authEntity.id,
      name: authEntity.name,
      slug: authEntity.slug,
      logo: authEntity.logo,
      metadata: typeof authEntity.metadata === "string" ? JSON.parse(authEntity.metadata) : authEntity.metadata,
      createdAt: authEntity.createdAt,
      updatedAt: authEntity.updatedAt,
    };
    return Organization.loadFromDb(props);
  }

  async save(organization: Organization): Promise<void> {
    const data: any = {
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: JSON.stringify(organization.metadata || {}),
      updatedAt: new Date(),
    };
    // better-auth adapter usage for update
    // We assume the entity exists if we are saving updates to it, or creates if new (but usually create is handled by auth.api.createOrganization)
    // The previous mongo repo handled upsert.
    // Auth adapter `update` requires specific method signature.
    // However, since we moved CREATE to use `auth.api.createOrganization` in the handler, `save` here is mostly for UPDATES.

    // If implementing full save (upsert) behavior:
    const existing = await this.findOneById(organization.id);
    if (existing) {
      await this.auth.options.database?.update!({
        model: "organization",
        where: [
          {
            field: "id",
            value: organization.id,
          },
        ],
        update: data,
      });
    }
    else {
      // NOTE: Creating via repository might bypass some Auth logic (plugins), but keeping for completeness if needed.
      // Ideally creation happens via API command.
      await this.auth.options.database?.create!({
        model: "organization",
        data: {
          ...data,
          id: organization.id,
          createdAt: organization.createdAt,
        },
      });
    }
  }

  async findOneById(id: string): Promise<Organization | null> {
    const result = await this.auth.options.database?.findOne!({
      model: "organization",
      where: [
        {
          field: "id",
          value: id,
        },
      ],
    });
    if (!result)
      return null;
    return this.toDomain(result);
  }

  async findOneBySlug(slug: string): Promise<Organization | null> {
    const result = await this.auth.options.database?.findOne!({
      model: "organization",
      where: [
        {
          field: "slug",
          value: slug,
        },
      ],
    });
    if (!result)
      return null;
    return this.toDomain(result);
  }

  async findManyByIds(ids: string[]): Promise<Organization[]> {
    const result = await this.auth.options.database?.findMany!({
      model: "organization",
      where: [
        {
          field: "id",
          operator: "in",
          value: ids,
        },
      ],
    });
    return (result || []).map((r: any) => this.toDomain(r));
  }
}
