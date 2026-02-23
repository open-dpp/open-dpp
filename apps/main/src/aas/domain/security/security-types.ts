import { MongoQuery, RawRule } from "@casl/ability";
import { PermissionType } from "@open-dpp/dto";
import { UserRole } from "../../../identity/users/domain/user-role.enum";

export interface SubjectAttributes { role: UserRole }

export type PlainRule = RawRule<[PermissionType, string], MongoQuery>;
