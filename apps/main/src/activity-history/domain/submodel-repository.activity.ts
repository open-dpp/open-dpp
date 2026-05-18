import {
  ActivityHeader,
  ActivitySchema,
  activityToDatabase,
  activityToPlain,
  IActivity,
  IActivityPayload,
} from "../activity";
import { ActivityTypes } from "../activity-types";
import { z } from "zod";
import { ActivityHeaderCreateProps, createActivityHeader } from "./shared.activity";
import {
  SubmodelRepositoryOperationTypesEnum,
  SubmodelRepositoryOperationTypesType,
} from "../submodel-repository-operation-types";
import { Submodel } from "../../aas/domain/submodel-base/submodel";

export class SubmodelRepositoryActivity implements IActivity {
  private constructor(
    public header: ActivityHeader,
    readonly payload: SubmodelRepositoryPayload,
  ) {}
  static create(
    data: ActivityHeaderCreateProps & {
      operation: SubmodelRepositoryOperationTypesType;
      submodel: Submodel;
    },
  ) {
    return new SubmodelRepositoryActivity(
      createActivityHeader(ActivityTypes.SubmodelRepositoryActivity, data),
      SubmodelRepositoryPayload.create({
        submodel: data.submodel,
        operation: data.operation,
      }),
    );
  }

  static fromPlain(data: unknown) {
    const parsed = ActivitySchema.parse(data);

    return new SubmodelRepositoryActivity(
      ActivityHeader.fromPlain(parsed.header),
      SubmodelRepositoryPayload.fromPlain(parsed.payload),
    );
  }

  toDatabase(): Record<string, unknown> {
    return activityToDatabase(this);
  }

  toPlain() {
    return activityToPlain(this);
  }
}

const SubmodelRepositoryPayloadSchema = z.object({
  operation: SubmodelRepositoryOperationTypesEnum,
  changes: z.any(),
});

export class SubmodelRepositoryPayload implements IActivityPayload {
  private constructor(
    public readonly operation: SubmodelRepositoryOperationTypesType,
    public readonly changes: any,
  ) {}

  static create(data: { operation: SubmodelRepositoryOperationTypesType; submodel: Submodel }) {
    return new SubmodelRepositoryPayload(data.operation, data.submodel.toPlain());
  }

  static fromPlain(data: unknown) {
    const parsed = SubmodelRepositoryPayloadSchema.parse(data);
    return new SubmodelRepositoryPayload(parsed.operation, parsed.changes);
  }

  toPlain() {
    return {
      changes: this.changes,
      operation: this.operation,
    };
  }
}
