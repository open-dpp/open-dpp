import { LanguageType } from "@open-dpp/dto";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

export type BaseEmailType =
  | "VERIFY_EMAIL"
  | "INVITE_USER_TO_ORGANIZATION"
  | "PASSWORD_RESET"
  | "EMAIL_CHANGE_NOTIFICATION"
  | "EMAIL_CHANGE_VERIFICATION"
  | "EMAIL_CHANGE_COMPLETED";

export interface BaseEmailCreateProps {
  type: BaseEmailType;
  template: string;
  to: string;
  subject: string;
  templateProperties: BaseEmailTemplateProperties;
  language?: LanguageType;
}

export class BaseEmail {
  public readonly id: string;
  public readonly type: BaseEmailType;
  public readonly template: string;
  public readonly to: string;
  public readonly subject: string;
  public readonly templateProperties: BaseEmailTemplateProperties;
  public readonly language: LanguageType;

  constructor(
    id: string,
    type: BaseEmailType,
    template: string,
    to: string,
    subject: string,
    templateProperties: BaseEmailTemplateProperties,
    language: LanguageType = "en",
  ) {
    this.id = id;
    this.type = type;
    this.template = template;
    this.to = to;
    this.subject = subject;
    this.templateProperties = templateProperties;
    this.language = language;
  }
}
