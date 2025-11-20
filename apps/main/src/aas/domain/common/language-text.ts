export enum Language {
  en = "en",
  de = "de",
}

export class LanguageText {
  private constructor(public readonly language: string, public readonly text: string) {
  }

  static create(language: string, text: string): LanguageText {
    return new LanguageText(language, text);
  }
}
