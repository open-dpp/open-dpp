import { JsonVisitorContextType } from "./json-visitor";
import { AasAbility } from "./security/aas-ability";
import { SubjectAttributes } from "./security/subject-attributes";

export interface ConvertToPlainOptions { filterBySubject?: SubjectAttributes; ability?: AasAbility; context?: JsonVisitorContextType }

export interface IConvertableToPlain {
  toPlain: (options?: ConvertToPlainOptions) => Record<string, any>;
}
