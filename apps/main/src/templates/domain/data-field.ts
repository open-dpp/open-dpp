import { z } from 'zod';
import {
  DataFieldBase,
  DataFieldType,
} from '../../data-modelling/domain/data-field-base';
import { GranularityLevel } from '../../data-modelling/domain/granularity-level';
import { randomUUID } from 'crypto';
import { NotSupportedError } from '@app/exception/domain.errors';

export class DataFieldValidationResult {
  private constructor(
    public readonly dataFieldId: string,
    public readonly dataFieldName: string,
    public readonly isValid: boolean,
    public readonly row?: number,
    public readonly errorMessage?: string,
  ) {}

  static create(data: {
    dataFieldId: string;
    dataFieldName: string;
    isValid: boolean;
    row?: number;
    errorMessage?: string;
  }): DataFieldValidationResult {
    return new DataFieldValidationResult(
      data.dataFieldId,
      data.dataFieldName,
      data.isValid,
      data.row,
      data.errorMessage,
    );
  }

  toJson() {
    return {
      id: this.dataFieldId,
      name: this.dataFieldName,
      ...(this.row ? { row: this.row } : {}),
      message: this.errorMessage,
    };
  }
}

type DataFieldProps = {
  name: string;
  options?: Record<string, unknown>;
  granularityLevel: GranularityLevel;
};

export type DataFieldDbProps = DataFieldProps & {
  id: string;
  type: DataFieldType;
};

export abstract class DataField extends DataFieldBase {
  protected static createInstance<T extends DataFieldBase>(
    Ctor: new (...args: any[]) => T,
    data: DataFieldProps,
    type: DataFieldType,
  ): T {
    return new Ctor(
      randomUUID(),
      data.name,
      type,
      data.options ?? {},
      data.granularityLevel,
    );
  }

  // Add static factory method for loadFromDb
  protected static loadFromDbInstance<T extends DataFieldBase>(
    Ctor: new (...args: any[]) => T,
    data: DataFieldDbProps,
  ): T {
    return new Ctor(
      data.id,
      data.name,
      data.type,
      data.options ?? {},
      data.granularityLevel,
    );
  }

  abstract validate(version: string, value: unknown): DataFieldValidationResult;
  toDbProps(): DataFieldDbProps {
    return {
      id: this.id,
      type: this.type,
      name: this._name,
      options: this.options,
      granularityLevel: this.granularityLevel,
    };
  }
}

function validateString(
  id: string,
  name: string,
  value: unknown,
): DataFieldValidationResult {
  const result = z.string().optional().safeParse(value);
  return DataFieldValidationResult.create({
    dataFieldId: id,
    dataFieldName: name,
    isValid: result.success,
    errorMessage: !result.success ? result.error.issues[0].message : undefined,
  });
}

export class TextField extends DataField {
  static create(data: DataFieldProps): TextField {
    return DataField.createInstance(TextField, data, DataFieldType.TEXT_FIELD);
  }

  static loadFromDb(data: DataFieldDbProps): TextField {
    return DataField.loadFromDbInstance(TextField, {
      ...data,
      type: DataFieldType.TEXT_FIELD,
    });
  }

  validate(version: string, value: unknown): DataFieldValidationResult {
    return validateString(this.id, this.name, value);
  }
}

export class ProductPassportLink extends DataField {
  static create(data: DataFieldProps): ProductPassportLink {
    return DataField.createInstance(
      ProductPassportLink,
      data,
      DataFieldType.PRODUCT_PASSPORT_LINK,
    );
  }

  static loadFromDb(data: DataFieldDbProps): ProductPassportLink {
    return DataField.loadFromDbInstance(ProductPassportLink, {
      ...data,
      type: DataFieldType.PRODUCT_PASSPORT_LINK,
    });
  }

  validate(version: string, value: unknown): DataFieldValidationResult {
    return validateString(this.id, this.name, value);
  }
}

export class NumericField extends DataField {
  static create(data: DataFieldProps): NumericField {
    return DataField.createInstance(
      NumericField,
      data,
      DataFieldType.NUMERIC_FIELD,
    );
  }

  static loadFromDb(data: DataFieldDbProps): NumericField {
    return DataField.loadFromDbInstance(NumericField, {
      ...data,
      type: DataFieldType.NUMERIC_FIELD,
    });
  }

  validate(version: string, value: unknown): DataFieldValidationResult {
    const result = z.number().optional().safeParse(value);
    return DataFieldValidationResult.create({
      dataFieldId: this.id,
      dataFieldName: this.name,
      isValid: result.success,
      errorMessage: !result.success
        ? result.error.issues[0].message
        : undefined,
    });
  }
}

export class FileField extends DataField {
  static create(data: DataFieldProps): FileField {
    return DataField.createInstance(FileField, data, DataFieldType.FILE_FIELD);
  }

  static loadFromDb(data: DataFieldDbProps): FileField {
    return DataField.loadFromDbInstance(FileField, {
      ...data,
      type: DataFieldType.FILE_FIELD,
    });
  }

  validate(version: string, value: unknown): DataFieldValidationResult {
    return validateString(this.id, this.name, value);
  }
}

const dataFieldSubtypes = [
  { value: TextField, name: DataFieldType.TEXT_FIELD },
  { value: ProductPassportLink, name: DataFieldType.PRODUCT_PASSPORT_LINK },
  { value: NumericField, name: DataFieldType.NUMERIC_FIELD },
  { value: FileField, name: DataFieldType.FILE_FIELD },
];

export function findDataFieldClassByTypeOrFail(type: DataFieldType) {
  const foundDataFieldType = dataFieldSubtypes.find((st) => st.name === type);
  if (!foundDataFieldType) {
    throw new NotSupportedError(`Data field type ${type} is not supported`);
  }
  return foundDataFieldType.value;
}
