import { randomUUID } from "node:crypto";
import { LanguageType } from "@open-dpp/dto";
import { ValueError } from "@open-dpp/exception";
import { EmailChangeNotificationMail } from "../../../email/domain/email-change-notification-mail";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const NOTIFICATION_SUBJECT_BY_LANGUAGE: Record<LanguageType, string> = {
  en: "Your email is being changed",
  de: "Deine E-Mail-Adresse wird geändert",
};

export interface EmailChangeRequestCreateProps {
  userId: string;
  newEmail: string;
  previousEmail: string;
}

export interface EmailChangeRequestDbProps {
  id: string;
  userId: string;
  newEmail: string;
  previousEmail: string;
  requestedAt: Date;
}

export class EmailChangeRequest {
  public readonly id: string;
  public readonly userId: string;
  public readonly newEmail: string;
  public readonly previousEmail: string;
  public readonly requestedAt: Date;

  private constructor(
    id: string,
    userId: string,
    newEmail: string,
    previousEmail: string,
    requestedAt: Date,
  ) {
    if (!userId) {
      throw new ValueError("EmailChangeRequest.userId must be non-empty");
    }
    if (!newEmail) {
      throw new ValueError("EmailChangeRequest.newEmail must be non-empty");
    }
    if (!previousEmail) {
      throw new ValueError("EmailChangeRequest.previousEmail must be non-empty");
    }
    this.id = id;
    this.userId = userId;
    this.newEmail = newEmail;
    this.previousEmail = previousEmail;
    this.requestedAt = requestedAt;
  }

  public static create(data: EmailChangeRequestCreateProps): EmailChangeRequest {
    return new EmailChangeRequest(
      randomUUID(),
      data.userId,
      data.newEmail,
      data.previousEmail,
      new Date(),
    );
  }

  public static loadFromDb(data: EmailChangeRequestDbProps): EmailChangeRequest {
    return new EmailChangeRequest(
      data.id,
      data.userId,
      data.newEmail,
      data.previousEmail,
      data.requestedAt,
    );
  }

  public generateNotificationEmail(props: {
    firstName: string | null;
    revokeUrl: string;
    language?: LanguageType;
  }): EmailChangeNotificationMail {
    const language = props.language ?? "en";
    return EmailChangeNotificationMail.create({
      to: this.previousEmail,
      subject: NOTIFICATION_SUBJECT_BY_LANGUAGE[language],
      language,
      templateProperties: {
        firstName: props.firstName ?? "User",
        currentEmail: this.previousEmail,
        newEmail: this.newEmail,
        revokeUrl: props.revokeUrl,
      },
    });
  }
}
