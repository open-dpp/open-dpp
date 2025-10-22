import type { KeycloakUserInToken } from "@open-dpp/auth";
import type { Model as MongooseModel } from "mongoose";
import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { NotFoundInDatabaseException } from "@open-dpp/exception";
import { User } from "../domain/user";
import { UserDoc, UserSchemaVersion } from "./user.schema";

@Injectable()
export class UsersService {
  private userDoc: MongooseModel<UserDoc>;

  constructor(
    @InjectModel(UserDoc.name)
    userDoc: MongooseModel<UserDoc>,
  ) {
    this.userDoc = userDoc;
  }

  convertToDomain(
    userDoc: UserDoc,
  ) {
    return User.loadFromDb({
      id: userDoc.id,
      email: userDoc.email,
      keycloakUserId: userDoc.keycloakUserId,
    });
  }

  async findOne(id: string) {
    const userFound = await this.userDoc.findById(id);
    return userFound ? this.convertToDomain(userFound) : undefined;
  }

  async findOneAndFail(id: string) {
    const userEntity = await this.userDoc.findById(id);
    if (!userEntity) {
      throw new NotFoundInDatabaseException(User.name);
    }
    return this.convertToDomain(userEntity);
  }

  async findByEmail(email: string) {
    const entities = await this.userDoc.find({
      email,
    });
    return entities.map(entity => this.convertToDomain(entity));
  }

  async findAllByIds(ids: Array<string>) {
    const entities = await this.userDoc.find({
      _id: {
        $in: ids,
      },
    });
    return entities.map(entity => this.convertToDomain(entity));
  }

  async findByKeycloakUserId(keycloakUserId: string) {
    const entity = await this.userDoc.findOne({
      keycloakUserId,
    });
    return entity === null ? null : this.convertToDomain(entity);
  }

  async save(user: User) {
    const entity = await this.userDoc.findOneAndUpdate(
      { _id: user.id },
      {
        $set: {
          _schemaVersion: UserSchemaVersion.v1_0_0,
          email: user.email,
          keycloakUserId: user.keycloakUserId,
        },
      },
      {
        new: true, // Return the updated document
        upsert: true, // Create a new document if none found
        runValidators: true,
      },
    );
    return this.convertToDomain(entity);
  }

  async create(keycloakUser: KeycloakUserInToken, ignoreIfExists?: boolean) {
    const find = await this.findByKeycloakUserId(keycloakUser.sub);
    if (!find) {
      return this.save(User.create({ email: keycloakUser.email, keycloakUserId: keycloakUser.sub }));
    }
    if (find && !ignoreIfExists) {
      throw new BadRequestException();
    }
  }
}
