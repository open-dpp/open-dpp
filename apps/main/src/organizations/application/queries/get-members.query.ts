import { Query } from "@nestjs/cqrs";
import { Member } from "../../domain/member";

export class GetMembersQuery extends Query<Member[]> {
  constructor(
    public readonly organizationId: string,
  ) {
    super();
  }
}
