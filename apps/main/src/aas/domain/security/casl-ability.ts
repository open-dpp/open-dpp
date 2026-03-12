import { MongoAbility } from "@casl/ability";
import { PermissionType } from "@open-dpp/dto";
import { IdShortPath } from "../submodel-base/submodel-base";

interface IAasResource {
  idShortPath: string;
  organizationId: string | undefined;
}

export class AasResource implements IAasResource {
  public readonly idShortPath: string;
  constructor(idShortPath: IdShortPath, public readonly organizationId: string | undefined) {
    this.idShortPath = idShortPath.toString();
  }

  static create(data: { idShortPath: IdShortPath; organizationId?: string }) {
    return new AasResource(data.idShortPath, data.organizationId);
  }

  getParentAasResource() {
    const parentPath = IdShortPath.create({ path: this.idShortPath }).getParentPath();
    if (!parentPath.isEmpty()) {
      return new AasResource(parentPath, this.organizationId);
    }
    return undefined;
  }
}

export const AasResourceKey = "AasResource";

type Subject = IAasResource | "AasResource";

export type CaslAbility = MongoAbility<[PermissionType, Subject]>;
