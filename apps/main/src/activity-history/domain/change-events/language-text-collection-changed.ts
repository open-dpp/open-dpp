import { Language, LanguageEnum } from "@open-dpp/dto";
import { IChangeEvent, IChangeEventWithPath } from "./change-event";
import { IdShortPath } from "../../../aas/domain/common/id-short-path";
import { z } from "zod/v4";
import { ChangeEventTypes, ChangeEventTypesType } from "./change-event-types";
import { ConvertToPlainOptions } from "../../../aas/domain/convertable-to-plain";
import { LanguageText } from "../../../aas/domain/common/language-text";

const LanguageTextChangedSchema = z.object({
  lng: LanguageEnum,
  op: z.literal(["replace", "add", "remove"]),
  oldValue: z.string().nullable(),
  newValue: z.string().nullable(),
});

const LanguageTextCollectionChangedSchema = z.object({
  path: z.string(),
  values: LanguageTextChangedSchema.array(),
});

type LanguageTextChanged = z.infer<typeof LanguageTextChangedSchema>;

abstract class LanguageTextCollectionChanged implements IChangeEventWithPath {
  protected constructor(
    public readonly type: ChangeEventTypesType,
    public readonly path: IdShortPath,
    public readonly values: LanguageTextChanged[],
  ) {}
  toPlain(_options?: ConvertToPlainOptions): Record<string, any> {
    return {
      type: this.type,
      path: this.path.toString(),
      values: this.values,
    };
  }
}

type LanguageTextChangedCreateProps = {
  path: IdShortPath;
  oldValue: LanguageText[];
  newValue: LanguageText[];
};

function createLanguageTextChanges({ oldValue, newValue }: LanguageTextChangedCreateProps) {
  return Object.values(Language)
    .map((language) => {
      const oldText = oldValue.find((oldLng) => oldLng.language === language);
      const newText = newValue.find((newLng) => newLng.language === language);
      let op: "replace" | "add" | "remove";
      if (oldText && newText) {
        op = "replace";
      } else if (oldText) {
        op = "remove";
      } else if (newText) {
        op = "add";
      } else {
        return undefined;
      }
      return LanguageTextChangedSchema.parse({
        lng: language,
        op,
        oldValue: oldText?.text ?? null,
        newValue: newText?.text ?? null,
      });
    })
    .filter((change) => change !== undefined);
}

export class DisplayNameChanged extends LanguageTextCollectionChanged implements IChangeEvent {
  static create(data: LanguageTextChangedCreateProps) {
    return new DisplayNameChanged(
      ChangeEventTypes.DisplayNameChanged,
      data.path,
      createLanguageTextChanges(data),
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = LanguageTextCollectionChangedSchema.parse(data);
    return new DisplayNameChanged(
      ChangeEventTypes.DisplayNameChanged,
      IdShortPath.create({ path: parsed.path }),
      parsed.values,
    );
  }
}

export class DescriptionChanged extends LanguageTextCollectionChanged implements IChangeEvent {
  static create(data: LanguageTextChangedCreateProps) {
    return new DescriptionChanged(
      ChangeEventTypes.DescriptionChanged,
      data.path,
      createLanguageTextChanges(data),
    );
  }

  static fromPlain(data: unknown): IChangeEvent {
    const parsed = LanguageTextCollectionChangedSchema.parse(data);
    return new DescriptionChanged(
      ChangeEventTypes.DescriptionChanged,
      IdShortPath.create({ path: parsed.path }),
      parsed.values,
    );
  }
}
