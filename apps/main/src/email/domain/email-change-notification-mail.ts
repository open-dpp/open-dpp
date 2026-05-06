import { randomUUID } from "node:crypto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

export interface EmailChangeNotificationMailTemplateProps extends BaseEmailTemplateProperties {
  firstName: string;
  currentEmail: string;
  newEmail: string;
  revokeUrl: string;
}
export interface EmailChangeNotificationMailCreateProps {
  to: string;
  subject: string;
  templateProperties: EmailChangeNotificationMailTemplateProps;
}

export class EmailChangeNotificationMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: EmailChangeNotificationMailTemplateProps,
  ) {
    super(
      id,
      "EMAIL_CHANGE_NOTIFICATION",
      "email-change-notification.mjml",
      to,
      subject,
      templateProperties,
    );
  }

  public static create(data: EmailChangeNotificationMailCreateProps) {
    return new EmailChangeNotificationMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
    );
  }
}
