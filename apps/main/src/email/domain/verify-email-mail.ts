import { randomUUID } from "node:crypto";
import { BaseEmail } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";

export interface VerifyEmailTemplateProps extends BaseEmailTemplateProperties {
  link: string;
  firstName: string;
}
export interface VerifyEmailMailCreateProps {
  to: string;
  subject: string;
  templateProperties: VerifyEmailTemplateProps;
}

export class VerifyEmailMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: VerifyEmailTemplateProps,
  ) {
    super(id, "VERIFY_EMAIL", "email-verify.mjml", to, subject, templateProperties);
  }

  public static create(data: VerifyEmailMailCreateProps) {
    return new VerifyEmailMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
    );
  }
}
