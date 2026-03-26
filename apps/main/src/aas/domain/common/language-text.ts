import { LanguageTextJsonSchema, LanguageType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { IVisitable, IVisitor } from "../visitor";

export class LanguageText implements IVisitable {
  private constructor(
    public readonly language: LanguageType,
    private _text: string,
  ) {}

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

export function hasUniqueLanguagesOrFail(items: Array<LanguageText>): void {
  const langs = items.map((i) => i.language.trim().toLowerCase());
  if (new Set(langs).size !== langs.length) {
    throw new ValueError("All language texts must have unique languages");
  }
}
