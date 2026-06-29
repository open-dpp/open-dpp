import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

export interface EmailChangeCompletedMailTemplateProps extends BaseEmailTemplateProperties {
  firstName: string;
  previousEmail: string;
  currentEmail: string;
}
export interface EmailChangeCompletedMailCreateProps {
  to: string;
  subject: string;
  templateProperties: EmailChangeCompletedMailTemplateProps;
  language?: LanguageType;
}

export class EmailChangeCompletedMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: EmailChangeCompletedMailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      "EMAIL_CHANGE_COMPLETED",
      "email-change-completed.mjml",
      to,
      subject,
      templateProperties,
      language,
    );
  }

  public static create(data: EmailChangeCompletedMailCreateProps) {
    return new EmailChangeCompletedMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
