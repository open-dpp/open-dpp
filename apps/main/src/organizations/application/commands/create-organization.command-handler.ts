import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Member } from "../../domain/member";
import { Organization } from "../../domain/organization";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { CreateOrganizationCommand } from "./create-organization.command";

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationCommandHandler implements ICommandHandler<CreateOrganizationCommand> {
  constructor(
    private readonly organizationsRepository: OrganizationsRepositoryPort,
    private readonly membersRepository: MembersRepositoryPort,
  ) { }

  async execute(command: CreateOrganizationCommand): Promise<void> {
    const organization = Organization.create({
      name: command.name,
      slug: command.slug,
      logo: command.logo,
      metadata: command.metadata,
    });
    await this.organizationsRepository.save(organization);

    const member = Member.create({
      organizationId: organization.id,
      userId: command.userId,
      role: "owner",
    });
    await this.membersRepository.save(member);
  }
}
