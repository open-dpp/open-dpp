import type { Auth } from "better-auth";
import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
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

  async save(user: User): Promise<User | null> {
    await (this.auth.api as any).createUser({
      body: {
        email: user.email, // required
        password: "", // required
        name: user.name, // required
        role: "user",
        data: {
          firstName: user.name,
          lastName: user.name,
        },
      },
    });
    return this.findOneByEmail(user.email);
  }

  async findOneById(id: string): Promise<User | null> {
    const document = await this.userModel.findById(id);
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
    const documents = await this.userModel.find({ _id: { $in: ids } });
    return documents.map(doc => UserMapper.toDomain(doc));
  }

  async setUserEmailVerified(email: string, emailVerified: boolean): Promise<void> {
    await this.userModel.findOneAndUpdate({ email }, { $set: { emailVerified } });
  }
}
