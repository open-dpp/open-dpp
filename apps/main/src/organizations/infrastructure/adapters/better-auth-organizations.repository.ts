import type { Auth } from "better-auth";
import { Inject, Injectable, Logger, NotImplementedException } from "@nestjs/common";
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
    let metadata = authEntity.metadata;

    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      }
      catch (error) {
        this.logger.warn(`Failed to parse metadata for organization ${authEntity.id}`, error);
        metadata = {};
      }
    }

    const props: OrganizationDbProps = {
      id: authEntity.id,
      name: authEntity.name,
      slug: authEntity.slug,
      logo: authEntity.logo,
      metadata: metadata || {},
      createdAt: authEntity.createdAt,
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

  async findManyByIds(_: string[]): Promise<Organization[]> {
    throw new NotImplementedException();
  }

  async findManyByMember(headers: Record<string, string>): Promise<Organization[]> {
    const result = await (this.auth.api as any).listOrganizations({
      headers,
    });

    if (!result || !Array.isArray(result)) {
      return [];
    }

    return result.map((org: any) => this.toDomain(org));
  }
}
