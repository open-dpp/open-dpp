import { randomUUID } from "node:crypto";
import { Expose } from "class-transformer";

export interface UserCreateProps {
  email: string;
  keycloakUserId: string;
}
export type UserDbProps = Omit<UserCreateProps, "template" | "model"> & {
  id: string;
  email: string;
  keycloakUserId: string;
};

export class User {
  @Expose()
  public readonly id: string;

  @Expose()
  public readonly email: string;

  @Expose()
  public readonly keycloakUserId: string;

  private constructor(
    id: string,
    email: string,
    keycloakUserId: string,
  ) {
    this.id = id;
    this.email = email;
    this.keycloakUserId = keycloakUserId;
  }

  public static create(data: UserCreateProps) {
    return new User(
      randomUUID(),
      data.email,
      data.keycloakUserId,
    );
  }

  public static loadFromDb(data: UserDbProps) {
    return new User(
      data.id,
      data.email,
      data.keycloakUserId,
    );
  }
}
