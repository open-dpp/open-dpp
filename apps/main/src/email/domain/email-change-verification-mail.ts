import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface EmailChangeVerificationMailTemplateProps extends BaseEmailTemplateProperties {
  firstName: string;
  newEmail: string;
  link: string;
}
export interface EmailChangeVerificationMailCreateProps {
  to: string;
  subject: string;
  templateProperties: EmailChangeVerificationMailTemplateProps;
  language?: LanguageType;
}

export class EmailChangeVerificationMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: EmailChangeVerificationMailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.EmailChangeVerification,
      new EmailTemplate("email-change-verification.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: EmailChangeVerificationMailCreateProps) {
    return new EmailChangeVerificationMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
