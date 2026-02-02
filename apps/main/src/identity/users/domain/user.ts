import { randomBytes } from "node:crypto";

export interface UserCreateProps {
  email: string;
  firstName?: string;
  lastName?: string;
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
  public readonly id: string;
  public readonly email: string;
  public readonly firstName: string | null;
  public readonly lastName: string | null;
  public readonly name: string | null;
  public readonly image: string | null;
  public readonly emailVerified: boolean;
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  private constructor(
    id: string,
    email: string,
    firstName: string | null,
    lastName: string | null,
    name: string | null,
    image: string | null,
    emailVerified: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
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
      data.firstName ?? null,
      data.lastName ?? null,
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
      data.firstName ?? null,
      data.lastName ?? null,
      data.name ?? null,
      data.image ?? null,
      data.emailVerified ?? false,
      data.createdAt,
      data.updatedAt,
    );
  }
}
