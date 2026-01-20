import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { UsersRepositoryPort } from "../../../users/domain/ports/users.repository.port";
import { MembersRepositoryPort } from "../../domain/ports/members.repository.port";
import { GetMembersQuery } from "./get-members.query";

@QueryHandler(GetMembersQuery)
export class GetMembersQueryHandler implements IQueryHandler<GetMembersQuery> {
  constructor(
    private readonly membersRepository: MembersRepositoryPort,
    private readonly usersRepository: UsersRepositoryPort,
  ) { }

  async execute(query: GetMembersQuery): Promise<any[]> {

    const userIds = members.map(member => member.userId);
    const users = await this.usersRepository.findAllByIds(userIds);
    const userMap = new Map(users.map(user => [user.id, user]));

    return members.map(member => ({
      ...member,
      user: userMap.get(member.userId)
        ? {
            id: userMap.get(member.userId)!.id,
            email: userMap.get(member.userId)!.email,
            name: userMap.get(member.userId)!.name,
            image: userMap.get(member.userId)!.image,
          }
        : null,
    }));
  }
}
