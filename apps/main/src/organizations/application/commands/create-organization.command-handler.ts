import type { Auth } from "better-auth";
import { Inject, Logger } from "@nestjs/common";
import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { AUTH } from "../../../auth/auth.provider";
import { Organization } from "../../domain/organization";
import { OrganizationMapper } from "../../infrastructure/mappers/organization.mapper";
import { CreateOrganizationCommand } from "./create-organization.command";

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationCommandHandler implements ICommandHandler<CreateOrganizationCommand> {
  private readonly logger = new Logger(CreateOrganizationCommandHandler.name);

  constructor(
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  async execute(command: CreateOrganizationCommand): Promise<Organization> {
    this.logger.log(`Creating organization ${command.name}`);
    const betterAuthOrganization = (this.auth.api as any).createOrganization({
      headers: command.headers,
      body: {
        name: command.name,
        slug: command.slug,
        logo: command.logo,
        metadata: JSON.stringify(command.metadata || {}),
      },
    });
    return OrganizationMapper.toDomainFromBetterAuth(betterAuthOrganization);
  }
}
