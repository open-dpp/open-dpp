import { LanguageTextJsonSchema, LanguageType } from "@open-dpp/aas";
import { IVisitable, IVisitor } from "../visitor";

export class LanguageText implements IVisitable {
  private constructor(public readonly language: LanguageType, public readonly text: string) {
  }

  static create(data: { language: LanguageType; text: string }): LanguageText {
    return new LanguageText(data.language, data.text);
  }

  static fromPlain(json: unknown): LanguageText {
    return LanguageText.create(LanguageTextJsonSchema.parse(json));
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitLanguageText(this, context);
  }
}
