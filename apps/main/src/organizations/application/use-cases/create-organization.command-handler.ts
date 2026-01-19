import { Inject, Injectable, Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { ORGANIZATIONS_REPO, OrganizationsRepositoryPort } from "../../domain/ports/organizations.repository.port";
import { CreateOrganizationCommand } from "./create-organization.command";

@Injectable()
@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationCommandHandler implements ICommandHandler<CreateOrganizationCommand> {
  private readonly logger = new Logger(CreateOrganizationCommandHandler.name);

  constructor(
    @Inject(ORGANIZATIONS_REPO) private organizationsRepo: OrganizationsRepositoryPort,
  ) {}

  async execute(command: CreateOrganizationCommand): Promise<void> {
    this.logger.log(`Organization ${""} created`);
  }
}
