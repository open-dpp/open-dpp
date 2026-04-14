import process from "node:process";
import { Injectable } from "@nestjs/common";
import { Status } from "../../domain/status";

@Injectable()
export class StatusService {
  getStatus(): Status {
    const version = process.env.APP_VERSION ?? process.env.npm_package_version ?? "unknown";
    return Status.create({ version });
  }
}
