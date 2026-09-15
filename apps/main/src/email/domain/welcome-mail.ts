import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface WelcomeMailTemplateProps extends BaseEmailTemplateProperties {
  firstName: string;
  organizationName: string;
  /** Password link; the reset token is valid for one hour. */
  link: string;
}

export interface WelcomeMailCreateProps {
  to: string;
  subject: string;
  templateProperties: WelcomeMailTemplateProps;
  language?: LanguageType;
}

/**
 * First mail to a provisioned owner who has no usable password yet (new or still
 * unverified user). Sent only by the provisioning path; `POST /users` keeps its mails.
 */
export class WelcomeMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: WelcomeMailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.Welcome,
      new EmailTemplate("provisioning-welcome.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: WelcomeMailCreateProps) {
    return new WelcomeMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
