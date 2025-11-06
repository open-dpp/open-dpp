import { randomUUID } from "node:crypto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

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
    super(id, "PASSWORD_RESET", "base-text-and-link.mjml", to, subject, {
      ...templateProperties,
      actionText: "Reset your password",
      text: "Please click the link below to reset your password.",
    });
  }

  public static create(data: PasswordResetMailMailCreateProps) {
    return new PasswordResetMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
    );
  }
}
