import { LanguageTextJsonSchema, LanguageType } from "@open-dpp/dto";
import { IVisitable, IVisitor } from "../visitor";

export class LanguageText implements IVisitable {
  private constructor(public readonly language: LanguageType, private _text: string) {
  }

  get text(): string {
    return this._text;
  }

  static create(data: { language: LanguageType; text: string }): LanguageText {
    return new LanguageText(data.language, data.text);
  }

  static fromPlain(json: unknown): LanguageText {
    return LanguageText.create(LanguageTextJsonSchema.parse(json));
  }

  changeText(text: string) {
    this._text = text;
  }

  accept<ContextT, R>(visitor: IVisitor<ContextT, R>, context?: ContextT): any {
    return visitor.visitLanguageText(this, context);
  }
}
