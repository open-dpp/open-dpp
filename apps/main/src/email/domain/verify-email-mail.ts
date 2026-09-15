import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface VerifyEmailTemplateProps extends BaseEmailTemplateProperties {
  link: string;
  firstName: string;
}
export interface VerifyEmailMailCreateProps {
  to: string;
  subject: string;
  templateProperties: VerifyEmailTemplateProps;
  language?: LanguageType;
}

export class VerifyEmailMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: VerifyEmailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.VerifyEmail,
      new EmailTemplate("email-verify.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: VerifyEmailMailCreateProps) {
    return new VerifyEmailMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
