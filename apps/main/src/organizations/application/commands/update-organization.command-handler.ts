import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { UpdateOrganizationCommand } from "./update-organization.command";

@CommandHandler(UpdateOrganizationCommand)
export class UpdateOrganizationCommandHandler implements ICommandHandler<UpdateOrganizationCommand> {
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
  ) { }

  async execute(command: UpdateOrganizationCommand): Promise<void> {
    const organization = await this.organizationsRepository.findOneById(command.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Since Organization is an immutable-ish entity (all props readonly), we might need a method to update it or create a copy.
    // Or we just create a new instance with updated values.
    // But since we are using DDD, we should probably add methods to the Entity, e.g. `updateName`, etc.
    // But for now I'll just re-create it or use `loadFromDb` with spread props, effectively updating it.
    // Wait, the entity has private constructor.
    // I should add an `update` method to Organization entity or use a copy mechanism.
    // I will use a simple update approach for now: modifying the props if I could, but they are readonly.
    // I will add an `update` method to Organization domain entity to handle this properly in the next step or now.
    // Actually, I can just create a new instance using loadFromDb with updated properties.

    // Simplest way for now without changing entity too much:
    const updatedProps: any = {
      id: organization.id,
      name: command.name ?? organization.name,
      slug: command.slug ?? organization.slug,
      logo: command.logo !== undefined ? command.logo : organization.logo,
      metadata: command.metadata ?? organization.metadata,
      createdAt: organization.createdAt,
      updatedAt: new Date(),
    };
    const updatedOrganization = Organization.loadFromDb(updatedProps as any); // Cast to any to avoid strict type issues if Props mismatch slightly

    await this.organizationsRepository.save(updatedOrganization);
  }
}
