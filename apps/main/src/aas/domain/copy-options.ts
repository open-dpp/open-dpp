import { JsonVisitorContextType } from "./json-visitor";
import { AasAbility } from "./security/aas-ability";
import { IVisitor } from "./visitor";

export interface ICopyOptions {
  ability?: AasAbility;
  context?: JsonVisitorContextType;
  transformer?: IVisitor<any, any>;
}
