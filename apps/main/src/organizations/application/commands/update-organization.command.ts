import { Command } from "@nestjs/cqrs";

export class UpdateOrganizationCommand extends Command<void> {
  constructor(
    public readonly organizationId: string,
    public readonly name?: string,
    public readonly slug?: string,
    public readonly logo?: string,
    public readonly metadata?: any,
  ) {
    super();
  }
}
