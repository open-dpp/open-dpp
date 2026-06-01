import { IChangeEvent } from "./change-event";
import { z } from "zod/v4";
import { ChangeEventTypes } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import {
  DigitalProductDocumentStatusChange,
  DigitalProductDocumentStatusEnum,
  DigitalProductDocumentStatusType,
} from "../../../digital-product-document/domain/digital-product-document-status";

const DigitalProductDocumentStatusChangedSchema = z.object({
  type: z.literal(ChangeEventTypes.DigitalProductDocumentStatusChanged),
  oldValue: DigitalProductDocumentStatusEnum.nullable(),
  newValue: DigitalProductDocumentStatusEnum,
});

export class DigitalProductDocumentStatusChanged implements IChangeEvent {
  public readonly type = ChangeEventTypes.DigitalProductDocumentStatusChanged;

  private constructor(
    public readonly oldValue: DigitalProductDocumentStatusType | null,
    public readonly newValue: DigitalProductDocumentStatusType,
  ) {}

  static create(data: { digitalProductDocumentStatusChange: DigitalProductDocumentStatusChange }) {
    return new DigitalProductDocumentStatusChanged(
      data.digitalProductDocumentStatusChange.previousStatus,
      data.digitalProductDocumentStatusChange.currentStatus,
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = DigitalProductDocumentStatusChangedSchema.parse(data);
    return new DigitalProductDocumentStatusChanged(parsed.oldValue, parsed.newValue);
  }

  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      oldValue: this.oldValue,
      newValue: this.newValue,
    };
  }
}
