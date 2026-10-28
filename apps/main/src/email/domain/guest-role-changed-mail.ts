import { randomUUID } from "node:crypto";
import { DisplayLanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, string> = {
  en: "Your guest role has changed",
  de: "Deine Gastrolle wurde geändert",
};

export interface GuestRoleChangedMailTemplateProps extends BaseEmailTemplateProperties {
  organizationName: string;
  guestRoleName: string;
  // Only for an invitation which is not accepted yet
  link?: string;
}
export interface GuestRoleChangedMailCreateProps {
  to: string;
  templateProperties: GuestRoleChangedMailTemplateProps;
  language?: DisplayLanguageType;
}

export class GuestRoleChangedMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: GuestRoleChangedMailTemplateProps,
    language: DisplayLanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.GuestRoleChanged,
      new EmailTemplate("guest-role-changed.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: GuestRoleChangedMailCreateProps) {
    const language = data.language ?? "en";
    return new GuestRoleChangedMail(
      randomUUID(),
      data.to,
      SUBJECT_BY_LANGUAGE[language],
      data.templateProperties,
      language,
    );
  }
}
