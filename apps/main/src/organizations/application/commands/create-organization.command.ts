import { Command } from "@nestjs/cqrs";

export class CreateOrganizationCommand extends Command<void> {
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
