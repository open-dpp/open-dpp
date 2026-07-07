import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

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
  language?: LanguageType;
}

export class EmailChangeNotificationMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: EmailChangeNotificationMailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      "EMAIL_CHANGE_NOTIFICATION",
      new EmailTemplate("email-change-notification.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: EmailChangeNotificationMailCreateProps) {
    return new EmailChangeNotificationMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
