import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { UsersRepositoryPort } from "../../domain/ports/users.repository.port";
import { User } from "../../domain/user";
import { GetUserQuery } from "./get-user.query";

@QueryHandler(GetUserQuery)
export class GetUserQueryHandler implements IQueryHandler<GetUserQuery> {
  constructor(
    private readonly usersRepository: UsersRepositoryPort,
  ) { }

  async execute(query: GetUserQuery): Promise<User | null> {
    return this.usersRepository.findOneById(query.userId);
  }
}
