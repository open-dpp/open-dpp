import { LanguageText } from "./language-text";

export interface IReferable {
  idShort: string;
  category: string | null;
  description: LanguageText[];
  displayName: LanguageText[];
}
