import type { Model as MongooseModel } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { DbSessionOptions } from "../../database/query-options";
import { findOne, findOneOrFail, save } from "../../lib/repositories";
import { Security } from "../domain/security/security";

import {
  SecurityDbValidationSchema,
  SecurityDoc,
  SecurityDocSchemaVersion,
} from "./schemas/security/security-db-schema";

@Injectable()
export class SecurityRepository {
  private securityDoc: MongooseModel<SecurityDoc>;

  constructor(
    @InjectModel(SecurityDoc.name)
    securityDoc: MongooseModel<SecurityDoc>,
  ) {
    this.securityDoc = securityDoc;
  }

  fromPlain(plain: any): Security {
    return Security.fromPlain(SecurityDbValidationSchema.encode(plain));
  }

  async save(security: Security, options?: DbSessionOptions) {
    return await save(security, this.securityDoc, SecurityDocSchemaVersion.v1_0_0, this.fromPlain.bind(this), SecurityDbValidationSchema, options);
  }

  async findOneOrFail(id: string): Promise<Security> {
    return await findOneOrFail(id, this.securityDoc, this.fromPlain.bind(this));
  }

  async findOne(id: string): Promise<Security | undefined> {
    return await findOne(id, this.securityDoc, this.fromPlain.bind(this));
  }
}
