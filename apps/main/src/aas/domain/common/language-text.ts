import { LanguageTextJsonSchema } from "../parsing/common/language-text-json-schema";
import { IVisitable, IVisitor } from "../visitor";
import { LanguageType } from "./language-enum";

export class LanguageText implements IVisitable<any> {
  private constructor(public readonly language: LanguageType, public readonly text: string) {
  }

  static create(data: { language: LanguageType; text: string }): LanguageText {
    return new LanguageText(data.language, data.text);
  }

  static fromPlain(json: unknown): LanguageText {
    return LanguageText.create(LanguageTextJsonSchema.parse(json));
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitLanguageText(this);
  }
}
