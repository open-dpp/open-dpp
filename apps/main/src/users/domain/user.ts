import { randomBytes } from "node:crypto";
import { Expose } from "class-transformer";

export interface UserCreateProps {
  email: string;
  name?: string;
  image?: string;
  emailVerified?: boolean;
}

export type UserDbProps = UserCreateProps & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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

  @Expose()
  public readonly name: string | null;

  @Expose()
  public readonly image: string | null;

  @Expose()
  public readonly emailVerified: boolean;

  @Expose()
  public readonly createdAt: Date;

  @Expose()
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    email: string,
    name: string | null,
    image: string | null,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.image = image;
    this.emailVerified = emailVerified;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  public static create(data: UserCreateProps) {
    const now = new Date();
    return new User(
      generate24CharId(),
      data.email,
      data.name ?? null,
      data.image ?? null,
      data.emailVerified ?? false,
      now,
      now,
    );
  }

  public static loadFromDb(data: UserDbProps) {
    return new User(
      data.id,
      data.email,
      data.name ?? null,
      data.image ?? null,
      data.emailVerified ?? false,
      data.createdAt,
      data.updatedAt,
    );
  }
}
