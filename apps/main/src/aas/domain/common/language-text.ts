import { LanguageTextJsonSchema } from "../parsing/aas-json-schemas";
import { IVisitable, IVisitor } from "../visitor";

export enum Language {
  en = "en",
  de = "de",
}

export class LanguageText implements IVisitable<any> {
  private constructor(public readonly language: string, public readonly text: string) {
  }

  static create(data: { language: string; text: string }): LanguageText {
    return new LanguageText(data.language, data.text);
  }

  static fromPlain(json: Record<string, unknown>): LanguageText {
    return LanguageText.create(LanguageTextJsonSchema.parse(json));
  }

  accept(visitor: IVisitor<any>): any {
    return visitor.visitLanguageText(this);
  }
}
