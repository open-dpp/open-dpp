import { Command } from "@nestjs/cqrs";

export class CreateUserCommand extends Command<void> {
  constructor(
    public readonly email: string,
    public readonly name?: string,
    public readonly image?: string,
  ) {
    super();
  }
}
