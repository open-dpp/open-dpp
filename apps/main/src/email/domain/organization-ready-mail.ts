import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

export interface OrganizationReadyMailTemplateProps extends BaseEmailTemplateProperties {
  firstName: string;
  organizationName: string;
  /** Deep link into the new organization. */
  link: string;
}

export interface OrganizationReadyMailCreateProps {
  to: string;
  subject: string;
  templateProperties: OrganizationReadyMailTemplateProps;
  language?: LanguageType;
}

/** Mail to a provisioned owner whose verified account already exists: nothing to set up. */
export class OrganizationReadyMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: OrganizationReadyMailTemplateProps,
    language?: LanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.OrganizationReady,
      new EmailTemplate("organization-ready.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: OrganizationReadyMailCreateProps) {
    return new OrganizationReadyMail(
      randomUUID(),
      data.to,
      data.subject,
      data.templateProperties,
      data.language,
    );
  }
}
