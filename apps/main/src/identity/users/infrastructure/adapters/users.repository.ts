import type { Auth } from "better-auth";
import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ObjectId } from "mongodb";
import { Model } from "mongoose";
import { AUTH } from "../../../auth/auth.provider";
import { User } from "../../domain/user";
import { UserMapper } from "../mappers/user.mapper";
import { User as UserSchema } from "../schemas/user.schema";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserSchema>,
    @Inject(AUTH) private readonly auth: Auth,
  ) { }

  async save(user: User, password?: string): Promise<User | null> {
    // If no password provided, generate a secure random one
    // This prevents empty password accounts while still allowing programmatic creation
    const finalPassword = password || randomUUID();

    await (this.auth.api as any).createUser({
      body: {
        email: user.email, // required
        password: finalPassword, // required
        name: user.name ?? ([user.firstName, user.lastName].filter(n => n != null).join(" ") || ""), // required
        role: "user",
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
    return this.findOneByEmail(user.email);
  }

  async findOneById(id: string): Promise<User | null> {
    const document = await this.userModel.findOne({ _id: new ObjectId(id) });
    if (!document)
      return null;
    return UserMapper.toDomain(document);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    const document = await this.userModel.findOne({ email });
    if (!document)
      return null;
    return UserMapper.toDomain(document);
  }

  async findAllByIds(ids: string[]): Promise<User[]> {
    // Use find with $in operator
    const objectIds = ids.map(id => new ObjectId(id));
    const documents = await this.userModel.find({ _id: { $in: objectIds } });
    return documents.map(doc => UserMapper.toDomain(doc));
  }

  async setUserEmailVerified(email: string, emailVerified: boolean): Promise<void> {
    await this.userModel.findOneAndUpdate({ email }, { $set: { emailVerified } });
  }
}
