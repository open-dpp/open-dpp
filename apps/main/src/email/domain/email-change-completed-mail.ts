import { randomUUID } from "node:crypto";
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
}

export class EmailChangeCompletedMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: EmailChangeCompletedMailTemplateProps,
  ) {
    super(
      id,
      "EMAIL_CHANGE_COMPLETED",
      "email-change-completed.mjml",
      to,
      subject,
      templateProperties,
    );
  }

  public static create(data: EmailChangeCompletedMailCreateProps) {
    return new EmailChangeCompletedMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
    );
  }
}
