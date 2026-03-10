import { MongoAbility } from "@casl/ability";
import { PermissionType } from "@open-dpp/dto";

interface IAasResource {
  idShortPath: string;
}

export class AasResource implements IAasResource {
  constructor(public readonly idShortPath: string) {
  }
}

type Subject = IAasResource | "AasResource";

export type CaslAbility = MongoAbility<[PermissionType, Subject]>;
