import { JsonVisitorContextType } from "./json-visitor";
import { AasAbility } from "./security/aas-ability";

export interface ConvertToPlainOptions { ability?: AasAbility; context?: JsonVisitorContextType }

export interface IConvertableToPlain {
  toPlain: (options?: ConvertToPlainOptions) => Record<string, any>;
}
