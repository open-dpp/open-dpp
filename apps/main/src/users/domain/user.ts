import { randomBytes } from "node:crypto";
import { Expose } from "class-transformer";

export interface UserCreateProps {
  email: string;
}
export type UserDbProps = UserCreateProps & {
  id: string;
  email: string;
};
function generate24CharId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = randomBytes(8).toString("hex");
  return timestamp + random;
}
export class User {
  @Expose()
  public readonly id: string;

  @Expose()
  public readonly email: string;

  private constructor(
    id: string,
    email: string,
  ) {
    this.id = id;
    this.email = email;
  }

  public static create(data: UserCreateProps) {
    return new User(
      generate24CharId(),
      data.email,
    );
  }

  public static loadFromDb(data: UserDbProps) {
    return new User(
      data.id,
      data.email,
    );
  }
}
