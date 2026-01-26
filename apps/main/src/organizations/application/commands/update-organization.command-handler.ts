import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Organization, OrganizationDbProps } from "../../domain/organization";
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

    const updatedProps: OrganizationDbProps = {
      id: organization.id,
      name: command.name ?? organization.name,
      slug: command.slug ?? organization.slug,
      logo: command.logo !== undefined ? command.logo : organization.logo,
      metadata: command.metadata ?? organization.metadata,
      createdAt: organization.createdAt,
    };
    const updatedOrganization = Organization.loadFromDb(updatedProps);

    await this.organizationsRepository.save(updatedOrganization);
  }
}
