import { LanguageType } from "@open-dpp/dto";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export const BaseEmailTypes = {
  VerifyEmail: "VERIFY_EMAIL",
  InviteUserToOrganization: "INVITE_USER_TO_ORGANIZATION",
  PasswordReset: "PASSWORD_RESET",
  EmailChangeNotification: "EMAIL_CHANGE_NOTIFICATION",
  EmailChangeVerification: "EMAIL_CHANGE_VERIFICATION",
  EmailChangeCompleted: "EMAIL_CHANGE_COMPLETED",
} as const;
export type BaseEmailType = (typeof BaseEmailTypes)[keyof typeof BaseEmailTypes];

export interface BaseEmailCreateProps {
  type: BaseEmailType;
  template: EmailTemplate;
  to: string;
  subject: string;
  language?: LanguageType;
}

export class BaseEmail {
  public readonly id: string;
  public readonly type: BaseEmailType;
  public readonly template: EmailTemplate;
  public readonly to: string;
  public readonly subject: string;
  public readonly language: LanguageType;

  constructor(
    id: string,
    type: BaseEmailType,
    template: EmailTemplate,
    to: string,
    subject: string,
    language: LanguageType = "en",
  ) {
    this.id = id;
    this.type = type;
    this.template = template;
    this.to = to;
    this.subject = subject;
    this.language = language;
  }

  // Convenience accessor: template data now lives on EmailTemplate.
  get templateProperties(): BaseEmailTemplateProperties {
    return this.template.properties;
  }
}
