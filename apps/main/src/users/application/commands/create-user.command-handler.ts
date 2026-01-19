import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { CreateUserCommand } from "./create-user.command";
import { UsersRepositoryPort } from "../../domain/ports/users.repository.port";
import { User } from "../../domain/user";

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand> {
    constructor(
        private readonly usersRepository: UsersRepositoryPort,
    ) { }

    async execute(command: CreateUserCommand): Promise<void> {
        const user = User.create({
            email: command.email,
            name: command.name,
            image: command.image,
        });
        await this.usersRepository.save(user);
    }
}
