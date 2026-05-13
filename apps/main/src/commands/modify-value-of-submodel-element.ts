import { IdShortPath } from "../aas/domain/common/id-short-path";
import { ValueModifierVisitorOptions } from "../aas/domain/value-modifier-visitor";
import { ICommand } from "./command.interface";

export class ModifyValueOfSubmodelElementCommand implements ICommand {
  public readonly version: string = "1.0.0";
  private constructor(
    public readonly data: unknown,
    public readonly idShortPath: IdShortPath,
    public readonly options: ValueModifierVisitorOptions,
    public readonly createdAt: Date,
  ) {}

  static create(data: {
    data: unknown;
    idShortPath: IdShortPath;
    options: ValueModifierVisitorOptions;
    createdAt?: Date;
  }): ModifyValueOfSubmodelElementCommand {
    return new ModifyValueOfSubmodelElementCommand(
      data.data,
      data.idShortPath,
      data.options,
      data.createdAt ?? new Date(),
    );
  }

  getUserId(): string | undefined | null {
    return this.options.ability.userId;
  }

  toPlainForActivity(): unknown {
    return {
      version: this.version,
      data: this.data,
      idShortPath: this.idShortPath.toString(),
    };
  }
}
