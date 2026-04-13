import { JsonVisitorContextType } from "./json-visitor";
import { AasAbility } from "./security/aas-ability";

export interface ICopyOptions {
  ability?: AasAbility;
  context?: JsonVisitorContextType;
}
