import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

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
      "EMAIL_CHANGE_VERIFICATION",
      "email-change-verification.mjml",
      to,
      subject,
      templateProperties,
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
