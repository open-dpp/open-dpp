import { LanguageTextJsonSchema } from "../parsing/common/language-text-json-schema";
import { IAasComponent, IVisitor } from "../visitor";
import { LanguageType } from "./language-enum";

export class LanguageText implements IAasComponent {
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
