import { Logger, Provider } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { apiKey } from "@better-auth/api-key";
import { admin, organization } from "better-auth/plugins";
import { Connection } from "mongoose";
import type { Db } from "mongodb";
import { EmailChangeVerificationMail } from "../../email/domain/email-change-verification-mail";
import { InviteUserToOrganizationMail } from "../../email/domain/invite-user-to-organization-mail";
import { PasswordResetMail } from "../../email/domain/password-reset-mail";
import { VerifyEmailMail } from "../../email/domain/verify-email-mail";
import { EmailService } from "../../email/email.service";
import {
  completeVerifiedEmailChange,
  decodeVerificationToken,
  guardEmailChangeUpdate,
  resolveUserLanguage,
} from "../email-change-requests/infrastructure/email-change-hooks";
import { EMAIL_CHANGE_REQUEST_TTL_SECONDS } from "../email-change-requests/infrastructure/schemas/email-change-request.schema";
import { findActiveOrganizationIdForUser } from "../organizations/infrastructure/active-organization-gate";
import { LanguageEnum, LanguageType, LatestApiVersionWithPrefixDto } from "@open-dpp/dto";

export const AUTH = "auth";

// Localized like the mjml template siblings (see EmailTemplate.localizedName).
const VERIFICATION_SUBJECT_BY_LANGUAGE: Record<LanguageType, string> = {
  en: "Confirm your new email address",
  de: "Neue E-Mail-Adresse bestätigen",
};

/**
 * Seeds the env-configured admin (OPEN_DPP_AUTH_ADMIN_USERNAME/PASSWORD) ONLY when
 * no admin account exists yet. This makes the env admin a one-time bootstrap seed
 * instead of a value re-created on every startup: once any admin exists — including
 * after an admin changes their own email — seeding is skipped, so the env
 * credentials can never silently resurrect a second admin account.
 *
 * Exported for unit testing.
 */
export async function ensureAdminSeeded(
  db: Db,
  // Structural type: the better-auth `Auth` generic does not unify across the import
  // boundary (duplicate better-call types + this app's user additionalFields), and
  // `createUser` is added at runtime by the admin plugin and absent from the static
  // api type — so we only require `api` and call createUser dynamically, as before.
  auth: { api: Record<string, any> },
  config: EnvService,
  logger: Logger,
): Promise<void> {
  const adminUsername = config.get("OPEN_DPP_AUTH_ADMIN_USERNAME");
  const adminPassword = config.get("OPEN_DPP_AUTH_ADMIN_PASSWORD");
  if (!adminUsername || !adminPassword) {
    return;
  }

  try {
    const existingAdmin = await db
      .collection("user")
      .findOne({ role: "admin" }, { projection: { _id: 1 } });
    if (existingAdmin) {
      logger.log("Admin account already exists; skipping admin seeding.");
      return;
    }

    await auth.api.createUser({
      body: {
        name: "open-dpp admin",
        data: {
          firstName: "open-dpp",
          lastName: "admin",
          emailVerified: true,
        },
        email: adminUsername,
        password: adminPassword,
        role: "admin",
      },
    });
    logger.log("Admin Account created");
  } catch (error) {
    if (error instanceof APIError) {
      logger.warn("Account with set admin username already exists and wont be updated.");
    } else {
      logger.error("Failed to create admin account", error);
    }
  }
}

export const AuthProvider: Provider = {
  provide: AUTH,
  inject: [EnvService, EmailService, getConnectionToken()],
  useFactory: async (
    configService: EnvService,
    emailService: EmailService,
    mongooseConnection: Connection,
  ) => {
    const logger = new Logger("AuthProvider");

    if (mongooseConnection.readyState !== 1) {
      const connectionTimeoutMs = 30_000;
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          mongooseConnection.off("open", onOpen);
          mongooseConnection.off("error", onError);
          reject(
            new Error(
              `MongoDB connection timed out after ${connectionTimeoutMs}ms (readyState: ${mongooseConnection.readyState})`,
            ),
          );
        }, connectionTimeoutMs);

        function onOpen() {
          clearTimeout(timer);
          mongooseConnection.off("error", onError);
          resolve();
        }

        function onError(error: any) {
          clearTimeout(timer);
          mongooseConnection.off("open", onOpen);
          reject(error);
        }

        mongooseConnection.once("open", onOpen);
        mongooseConnection.once("error", onError);
      });
    }

    const db = mongooseConnection.db;
    if (!db) {
      throw new Error("Database connection not established");
    }
    const mongoClient = mongooseConnection.getClient();

    const auth = betterAuth({
      baseURL: configService.get("OPEN_DPP_URL"),
      basePath: `/api/${LatestApiVersionWithPrefixDto}/auth`,
      secret: configService.get("OPEN_DPP_AUTH_SECRET"),
      trustedOrigins: [configService.get("OPEN_DPP_URL")],
      logger: {
        disabled: false,
        log: (level, message, ...args) => {
          const formattedMessage = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
          switch (level) {
            case "error":
              logger.error(formattedMessage);
              break;
            case "warn":
              logger.warn(formattedMessage);
              break;
            case "debug":
              logger.debug(formattedMessage);
              break;
            case "info":
            default:
              logger.log(formattedMessage);
              break;
          }
        },
      },
      user: {
        additionalFields: {
          firstName: {
            type: "string",
            required: true,
            input: true,
          },
          lastName: {
            type: "string",
            required: true,
            input: true,
          },
          name: {
            type: "string",
            required: false,
            input: true,
          },
          preferredLanguage: {
            type: "string",
            required: false,
            input: true,
            defaultValue: "en",
            validator: { input: LanguageEnum },
          },
        },
        changeEmail: {
          enabled: true,
        },
      },
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, token }) => {
          const firstName = (user as any).firstName ?? "User";
          await emailService.send(
            PasswordResetMail.create({
              to: user.email,
              subject: "Password reset",
              templateProperties: {
                link: `${configService.get("OPEN_DPP_URL")}/password-reset?token=${token}`,
                firstName,
              },
            }),
          );
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        expiresIn: EMAIL_CHANGE_REQUEST_TTL_SECONDS,
        sendVerificationEmail: async ({
          user,
          url,
          token,
        }: {
          user: any;
          url: string;
          token: string;
        }) => {
          const firstName = (user as any).firstName ?? "User";
          const decoded = decodeVerificationToken({ query: { token } });
          if (decoded?.updateTo) {
            const language = resolveUserLanguage(user);
            await emailService.send(
              EmailChangeVerificationMail.create({
                to: user.email,
                subject: VERIFICATION_SUBJECT_BY_LANGUAGE[language],
                language,
                templateProperties: {
                  firstName,
                  newEmail: user.email,
                  link: url,
                },
              }),
            );
            return;
          }
          await emailService.send(
            VerifyEmailMail.create({
              to: user.email,
              subject: "Verify E-Mail address",
              templateProperties: {
                link: url,
                firstName,
              },
            }),
          );
        },
      },
      databaseHooks: {
        session: {
          create: {
            before: async (session) => {
              try {
                const activeOrganizationId = await findActiveOrganizationIdForUser(
                  db,
                  session.userId,
                );
                return {
                  data: {
                    ...session,
                    activeOrganizationId,
                  },
                };
              } catch (error) {
                logger.error("Failed to get active organization for session", error);
                return {
                  data: session,
                };
              }
            },
          },
        },
        user: {
          update: {
            before: async (data, context) => guardEmailChangeUpdate(db, logger, data, context),
            after: async (user) => completeVerifiedEmailChange(db, emailService, logger, user),
          },
        },
      },
      hooks: {},
      plugins: [
        apiKey({
          enableSessionForAPIKeys: false,
          rateLimit: {
            enabled: true,
            timeWindow: 1000 * 60, // 1 minute
            maxRequests: 100, // 100 requests per timeWindow
          },
        }),
        organization({
          async sendInvitationEmail(data) {
            try {
              if (!data.organization) {
                logger.error("Organization data is missing in sendInvitationEmail", data);
                return;
              }
              const inviteLink = `${configService.get("OPEN_DPP_URL")}/accept-invitation/${data.id}`;
              await emailService.send(
                InviteUserToOrganizationMail.create({
                  to: data.email,
                  subject: "Invitation to join organization",
                  templateProperties: {
                    link: inviteLink,
                    firstName: "User",
                    organizationName: data.organization.name,
                  },
                }),
              );
            } catch (error) {
              logger.error("Failed to send invitation email", error);
            }
          },
        }),
        admin({}),
      ],
      database: mongodbAdapter(db, {
        client: configService.get("NODE_ENV") === "test" ? undefined : mongoClient,
      }),
    });

    await ensureAdminSeeded(db, auth, configService, logger);
    logger.log("Auth initialized");

    return auth;
  },
};
