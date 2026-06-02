import { ActivityHeader, ActivityHeaderSchema } from "./activity-header";
import {
  IChangeEvent,
  isChangeEventWithPath,
  isPolicyChangeEvent,
} from "../change-events/change-event";
import {
  ConvertToPlainOptions,
  IConvertableToPlain,
} from "../../../aas/domain/convertable-to-plain";
import { Permissions } from "@open-dpp/dto";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { SubjectAttributes } from "../../../aas/domain/security/subject-attributes";
import { ActivityTypesEnum } from "./activity-types";
import { getActivityClass } from "./activity-registry";
import { z } from "zod/v4";

export interface SharedActivityCreateProps {
  digitalProductDocumentId: string;
  userId?: string;
  createdAt?: Date;
  correlationId: string;
}

export function createActivityHeader(
  type: string,
  data: SharedActivityCreateProps,
  version: string,
) {
  return ActivityHeader.create({
    type,
    version: version,
    aggregateId: data.digitalProductDocumentId,
    userId: data.userId,
    createdAt: data.createdAt,
    correlationId: data.correlationId,
  });
}

export function filterChangesByAbility(changes: IChangeEvent[], options?: ConvertToPlainOptions) {
  return changes.filter((change) => {
    if (isChangeEventWithPath(change) && options?.ability) {
      const canReadPath = options.ability.can(
        Permissions.Read,
        IdShortPath.create({ path: change.path.toString() }),
      );
      if (canReadPath && isPolicyChangeEvent(change)) {
        const subjectAttribute = SubjectAttributes.create({
          userRole: change.userRole,
          memberRole: change.memberRole ?? undefined,
        });
        const subjectsToConsider = options.ability.getSubject().getSubjectsWithSubordinatedRoles();
        return subjectsToConsider.some((subject) => {
          return subject.isEqual(subjectAttribute);
        });
      } else {
        return canReadPath;
      }
    }
    return true;
  });
}

const PayloadSchema = z.looseObject({
  changes: z.any().array(),
});

export const ActivitySchema = z.object({
  header: ActivityHeaderSchema,
  payload: PayloadSchema,
});

export function activityToDatabase(event: IActivity) {
  return {
    ...event.header.toPlain(),
    _id: event.header.id,
    payload: event.payload.toPlain(),
  };
}

export function activityToPlain(event: IActivity) {
  return {
    header: event.header.toPlain(),
    payload: event.payload.toPlain(),
  };
}

export interface IActivityPayload extends IConvertableToPlain {
  changes: Array<IChangeEvent>;
}

export interface IActivity extends IConvertableToPlain {
  header: ActivityHeader;
  payload: IActivityPayload;
  toDatabase: () => Record<string, any>;
}

export function parseActivity(activity: any): IActivity {
  const schema = z.object({ header: z.object({ type: ActivityTypesEnum }) });
  const ActivityClass = getActivityClass(schema.parse(activity).header.type);
  return ActivityClass.fromPlain(activity);
}
