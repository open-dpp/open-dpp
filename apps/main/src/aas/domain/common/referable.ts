import { LanguageText } from "./language-text";

export interface IReferable {
  idShort: string;
  category: string[];
  description: LanguageText[];
  parent: IReferable[];
}
