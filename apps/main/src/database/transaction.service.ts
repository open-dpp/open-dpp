import type { Connection } from "mongoose";
import { Injectable } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { DbSessionOptions } from "./query-options";

@Injectable()
export class TransactionService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async withTransaction<T>(work: (options: DbSessionOptions) => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        result = await work({ session });
      });
      return result;
    } finally {
      await session.endSession();
    }
  }
}
