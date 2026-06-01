import { ChangeEventTypeEnum, ChangeEventTypesType } from "./change-event-types";
import { z } from "zod";
import { getChangeEventClass } from "./change-event-registry";
import { IConvertableToPlain } from "../../../aas/domain/convertable-to-plain";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";

export interface IChangeEvent extends IConvertableToPlain {
  type: ChangeEventTypesType;
}

export interface IChangeEventWithPath extends IChangeEvent {
  path: IdShortPath | string;
}

export function parseChangeEvent(changeEvent: any): IChangeEvent {
  const schema = z.object({ type: ChangeEventTypeEnum });
  const ChangeEventClass = getChangeEventClass(schema.parse(changeEvent).type);
  return ChangeEventClass.fromPlain(changeEvent);
}

export const ChangeEventSchema = z.record(z.string(), z.unknown());
