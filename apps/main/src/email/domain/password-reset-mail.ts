import { randomUUID } from "node:crypto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface PasswordResetMailTemplateProps extends BaseEmailTemplateProperties {
  link: string;
  firstName: string;
}
export interface PasswordResetMailMailCreateProps {
  to: string;
  subject: string;
  templateProperties: PasswordResetMailTemplateProps;
}

export class PasswordResetMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: PasswordResetMailTemplateProps,
  ) {
    super(
      id,
      "PASSWORD_RESET",
      new EmailTemplate("base-text-and-link.mjml", {
        ...templateProperties,
        actionText: "Reset your password",
        text: "Please click the link below to reset your password.",
      }),
      to,
      subject,
    );
  }

  public static create(data: PasswordResetMailMailCreateProps) {
    return new PasswordResetMail(randomUUID(), data.to, data.subject, data.templateProperties);
  }
}
