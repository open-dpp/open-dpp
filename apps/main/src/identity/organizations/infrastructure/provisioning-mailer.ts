import { Injectable, Logger } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { DisplayLanguageType } from "@open-dpp/dto";
import { OrganizationReadyMail } from "../../../email/domain/organization-ready-mail";
import { WelcomeMail } from "../../../email/domain/welcome-mail";
import { EmailService } from "../../../email/email.service";
import { EmailVerificationLinkBuilder } from "../../auth/infrastructure/adapters/email-verification-link.builder";
import { PasswordResetTokensRepository } from "../../auth/infrastructure/adapters/password-reset-tokens.repository";
import { createVerifyEmailMail } from "../../auth/infrastructure/verify-email-mail.factory";
import { User } from "../../users/domain/user";
import { Organization } from "../domain/organization";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const WELCOME_SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, string> = {
  en: "Start using open-dpp",
  de: "Jetzt mit open-dpp starten",
};
const READY_SUBJECT_BY_LANGUAGE: Record<DisplayLanguageType, (organizationName: string) => string> =
  {
    en: (organizationName) => `Your organization ${organizationName} is ready`,
    de: (organizationName) => `Ihre Organisation ${organizationName} ist bereit`,
  };
export interface OwnerNotification {
  user: User;
  organization: Organization;
  language: DisplayLanguageType;
}

/**
 * Mails for a provisioned owner (#853). Which mails depends on the owner's state:
 * an unverified user (new or existing) gets the welcome mail with a password link plus
 * the standard verification mail; a verified user gets the "ready" mail. Failures are
 * logged and reported, never thrown: the organization exists either way.
 *
 * Every mail is sent through EmailService directly, including the verification mail:
 * better-auth's `sendVerificationEmail` route runs the mail callback as a background task
 * and swallows its errors, which would make `emailSent` a lie.
 */
@Injectable()
export class ProvisioningMailer {
  private readonly logger = new Logger(ProvisioningMailer.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: EnvService,
    private readonly passwordResetTokensRepository: PasswordResetTokensRepository,
    private readonly emailVerificationLinkBuilder: EmailVerificationLinkBuilder,
  ) {}

  /** `true` only when every mail of the owner's case was sent. */
  async notifyOwner(notification: OwnerNotification): Promise<boolean> {
    if (notification.user.emailVerified) {
      return this.sendReady(notification);
    }
    const welcomeSent = await this.sendWelcome(notification);
    const verificationSent = await this.sendVerification(notification);
    return welcomeSent && verificationSent;
  }

  private async sendWelcome({ user, organization, language }: OwnerNotification): Promise<boolean> {
    try {
      const token = await this.passwordResetTokensRepository.mint(user.id);
      await this.emailService.send(
        WelcomeMail.create({
          to: user.email,
          subject: WELCOME_SUBJECT_BY_LANGUAGE[language],
          language,
          templateProperties: {
            firstName: user.firstName ?? "",
            organizationName: organization.name,
            link: `${this.baseUrl()}/password-reset?token=${token}`,
          },
        }),
      );
      return true;
    } catch (error) {
      // Never log the token or the link.
      this.logger.error(
        `Provisioning: welcome mail for owner ${user.id} of organization ${organization.id} failed`,
        error,
      );
      return false;
    }
  }

  private async sendVerification({
    user,
    organization,
    language,
  }: OwnerNotification): Promise<boolean> {
    try {
      const link = await this.emailVerificationLinkBuilder.build(user.email);
      await this.emailService.send(
        createVerifyEmailMail({
          to: user.email,
          firstName: user.firstName ?? "",
          language,
          link,
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Provisioning: verification mail for owner ${user.id} of organization ${organization.id} failed`,
        error,
      );
      return false;
    }
  }

  private async sendReady({ user, organization, language }: OwnerNotification): Promise<boolean> {
    try {
      await this.emailService.send(
        OrganizationReadyMail.create({
          to: user.email,
          subject: READY_SUBJECT_BY_LANGUAGE[language](organization.name),
          language,
          templateProperties: {
            firstName: user.firstName ?? "",
            organizationName: organization.name,
            link: `${this.baseUrl()}/organizations/${organization.id}/passports`,
          },
        }),
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Provisioning: ready mail for owner ${user.id} of organization ${organization.id} failed`,
        error,
      );
      return false;
    }
  }

  private baseUrl(): string {
    return this.configService.get("OPEN_DPP_URL");
  }
}
