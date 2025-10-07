import { randomUUID } from "node:crypto";
import { Expose } from "class-transformer";

export interface UserCreateProps {
  email: string;
}
export type UserDbProps = Omit<UserCreateProps, "template" | "model"> & {
  id: string;
  email: string;
};

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
      randomUUID(),
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
