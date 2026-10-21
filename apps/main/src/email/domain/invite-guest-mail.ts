import { randomUUID } from "node:crypto";
import { DisplayLanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, string> = {
  en: "Invitation to access product passport data",
  de: "Einladung zum Zugriff auf Produktpassdaten",
};

export interface InviteGuestMailTemplateProps extends BaseEmailTemplateProperties {
  link: string;
  organizationName: string;
  guestRoleName: string;
}
export interface InviteGuestMailCreateProps {
  to: string;
  templateProperties: InviteGuestMailTemplateProps;
  language?: DisplayLanguageType;
}

export class InviteGuestMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: InviteGuestMailTemplateProps,
    language: DisplayLanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.InviteGuest,
      new EmailTemplate("invite-guest.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: InviteGuestMailCreateProps) {
    const language = data.language ?? "en";
    return new InviteGuestMail(
      randomUUID(),
      data.to,
      SUBJECT_BY_LANGUAGE[language],
      data.templateProperties,
      language,
    );
  }
}
