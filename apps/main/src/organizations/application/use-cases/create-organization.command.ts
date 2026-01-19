import { Command } from "@nestjs/cqrs";

export class CreateOrganizationCommand extends Command<void> {
  constructor(
    public readonly name: string,
  ) {
    super();
  }
}
