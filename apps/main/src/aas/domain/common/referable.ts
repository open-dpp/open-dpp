import { LanguageText } from "./language-text";

export interface IReferable {
  idShort: string | null;
  category: string | null;
  description: LanguageText[] | null;
  displayName: LanguageText[] | null;
}
