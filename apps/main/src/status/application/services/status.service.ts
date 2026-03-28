import { Injectable } from "@nestjs/common";
import packageJson from "../../../../package.json";
import { Status } from "../../domain/status";

@Injectable()
export class StatusService {
  getStatus(): Status {
    return Status.create({ version: packageJson.version });
  }
}
