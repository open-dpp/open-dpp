import { Query } from "@nestjs/cqrs";
import { User } from "../../domain/user";

export class GetUserQuery extends Query<User | null> {
  constructor(
    public readonly userId: string,
  ) {
    super();
  }
}
