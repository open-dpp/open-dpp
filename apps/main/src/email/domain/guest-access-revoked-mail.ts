import { randomUUID } from "node:crypto";
import { DisplayLanguageType } from "@open-dpp/dto";
import { BaseEmail, BaseEmailTypes } from "./base-email";
import { BaseEmailTemplateProperties } from "./base-email-template-properties";
import { EmailTemplate } from "./email-template";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const SUBJECT_BY_LANGUAGE: Record<
  DisplayLanguageType,
  { accepted: string; invitationWithdrawn: string }
> = {
  en: {
    accepted: "Your guest access was revoked",
    invitationWithdrawn: "Your invitation was withdrawn",
  },
  de: {
    accepted: "Dein Gastzugriff wurde entzogen",
    invitationWithdrawn: "Deine Einladung wurde zurückgezogen",
  },
};

export interface GuestAccessRevokedMailTemplateProps extends BaseEmailTemplateProperties {
  organizationName: string;
  // False if the guest had not accepted the invitation yet, so only the invitation is withdrawn
  accepted: boolean;
}
export interface GuestAccessRevokedMailCreateProps {
  to: string;
  templateProperties: GuestAccessRevokedMailTemplateProps;
  language?: DisplayLanguageType;
}

export class GuestAccessRevokedMail extends BaseEmail {
  private constructor(
    id: string,
    to: string,
    subject: string,
    templateProperties: GuestAccessRevokedMailTemplateProps,
    language: DisplayLanguageType,
  ) {
    super(
      id,
      BaseEmailTypes.GuestAccessRevoked,
      new EmailTemplate("guest-access-revoked.mjml", templateProperties),
      to,
      subject,
      language,
    );
  }

  public static create(data: GuestAccessRevokedMailCreateProps) {
    const language = data.language ?? "en";
    const subjects = SUBJECT_BY_LANGUAGE[language];
    return new GuestAccessRevokedMail(
      randomUUID(),
      data.to,
      data.templateProperties.accepted ? subjects.accepted : subjects.invitationWithdrawn,
      data.templateProperties,
      language,
    );
  }
}
