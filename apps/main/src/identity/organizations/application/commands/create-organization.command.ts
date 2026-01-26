import { Command } from "@nestjs/cqrs";
import { Organization } from "../../domain/organization";

export class CreateOrganizationCommand extends Command<Organization> {
  constructor(
    public readonly userId: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly headers: Record<string, string>,
    public readonly logo?: string,
    public readonly metadata?: any,
  ) {
    super();
  }
}
