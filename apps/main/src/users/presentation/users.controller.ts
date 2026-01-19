import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { CreateUserCommand } from "../../application/commands/create-user.command";
import { GetUserQuery } from "../../application/queries/get-user.query";
import { User } from "../../domain/user";

@Controller("users")
export class UsersController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) { }

    @Post()
    async createUser(@Body() body: { email: string; name?: string; image?: string }) {
        await this.commandBus.execute(new CreateUserCommand(body.email, body.name, body.image));
    }

    @Get(":id")
    async getUser(@Param("id") id: string): Promise<User | null> {
        return this.queryBus.execute(new GetUserQuery(id));
    }
}
