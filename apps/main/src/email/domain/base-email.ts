import { BaseEmailTemplateProperties } from "./base-email-template-properties";

export type BaseEmailType = "VERIFY_EMAIL" | "INVITE_USER_TO_ORGANIZATION" | "PASSWORD_RESET";

export interface BaseEmailCreateProps {
  type: BaseEmailType;
  template: string;
  to: string;
  subject: string;
  templateProperties: BaseEmailTemplateProperties;
}

export class BaseEmail {
  public readonly id: string;
  public readonly type: BaseEmailType;
  public readonly template: string;
  public readonly to: string;
  public readonly subject: string;
  public readonly templateProperties: BaseEmailTemplateProperties;

  constructor(
    id: string,
    type: BaseEmailType,
    template: string,
    to: string,
    subject: string,
    templateProperties: BaseEmailTemplateProperties,
  ) {
    this.id = id;
    this.type = type;
    this.template = template;
    this.to = to;
    this.subject = subject;
    this.templateProperties = templateProperties;
  }
}
