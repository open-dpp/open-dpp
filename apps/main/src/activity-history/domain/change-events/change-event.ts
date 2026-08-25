import { ChangeEventTypeEnum, ChangeEventTypesType } from "./change-event-types";
import { z } from "zod";
import { getChangeEventClass } from "./change-event-registry";
import { IConvertableToPlain } from "../../../aas/domain/convertable-to-plain";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { UserRoleType } from "../../../identity/users/domain/user-role.enum";
import { MemberRoleType } from "../../../identity/organizations/domain/member-role.enum";

export interface IChangeEvent extends IConvertableToPlain {
  type: ChangeEventTypesType;
  isNoop(): boolean;
}

export interface IChangeEventWithPath extends IChangeEvent {
  path: IdShortPath | string;
}

export interface IPolicyChangeEvent extends IChangeEventWithPath {
  userRole: UserRoleType;
  memberRole: MemberRoleType | null;
}

export function isChangeEventWithPath(
  changeEvent: IChangeEvent,
): changeEvent is IChangeEventWithPath {
  return "path" in changeEvent;
}

export function isPolicyChangeEvent(changeEvent: IChangeEvent): changeEvent is IPolicyChangeEvent {
  return "userRole" in changeEvent && "memberRole" in changeEvent;
}

export function parseChangeEvent(changeEvent: any): IChangeEvent {
  const schema = z.object({ type: ChangeEventTypeEnum });
  const ChangeEventClass = getChangeEventClass(schema.parse(changeEvent).type);
  return ChangeEventClass.fromPlain(changeEvent);
}

export const ChangeEventSchema = z.record(z.string(), z.unknown());
