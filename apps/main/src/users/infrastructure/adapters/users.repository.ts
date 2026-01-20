import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UsersRepositoryPort } from "../../domain/ports/users.repository.port";
import { User } from "../../domain/user";
import { UserMapper } from "../mappers/user.mapper";
import { User as UserSchema } from "../schemas/user.schema";

@Injectable()
export class UsersRepository implements UsersRepositoryPort {
  constructor(
    @InjectModel(UserSchema.name)
    private readonly userModel: Model<UserSchema>,
  ) { }

  async save(user: User): Promise<void> {
    const persistenceModel = UserMapper.toPersistence(user);
    await this.userModel.findByIdAndUpdate(
      user.id,
      persistenceModel,
      { upsert: true },
    );
  }

  async findOneById(id: string): Promise<User | null> {
    const document = await this.userModel.findById(id);

  async findOneByEmail(email: string): Promise<User | null> {

  async findAllByIds(ids: string[]): Promise<User[]> {
    // Use find with $in operator
    const documents = await this.userModel.find({ _id: { $in: ids } });
    return documents.map(doc => UserMapper.toDomain(doc));
  }
}
