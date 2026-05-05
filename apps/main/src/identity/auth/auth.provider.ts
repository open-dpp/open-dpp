import { Logger, Provider } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { apiKey } from "@better-auth/api-key";
import { admin, organization } from "better-auth/plugins";
import { Connection, Types } from "mongoose";
import { InviteUserToOrganizationMail } from "../../email/domain/invite-user-to-organization-mail";
import { PasswordResetMail } from "../../email/domain/password-reset-mail";
import { VerifyEmailMail } from "../../email/domain/verify-email-mail";
import { EmailService } from "../../email/email.service";
import { EMAIL_CHANGE_REQUEST_COLLECTION } from "../email-change-requests/infrastructure/schemas/email-change-request.schema";

export const AUTH = "auth";

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
      basePath: "/api/auth",
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
          },
        },
        changeEmail: {
          enabled: true,
          sendChangeEmailVerification: async ({
            user,
            newEmail,
            url,
          }: {
            user: { firstName?: string };
            newEmail: string;
            url: string;
            token: string;
          }) => {
            try {
              const firstName = user.firstName ?? "User";
              if (!user.firstName) {
                logger.warn(
                  `sendChangeEmailVerification invoked without firstName on user payload (newEmail=${newEmail})`,
                );
              }
              await emailService.send(
                VerifyEmailMail.create({
                  to: newEmail,
                  subject: "Confirm your new email address",
                  templateProperties: { link: url, firstName },
                }),
              );
            } catch (error) {
              logger.error("Failed to send email change verification", error);
              throw error;
            }
          },
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
        sendVerificationEmail: async ({ user, url }: { user: any; url: string; token: string }) => {
          const firstName = (user as any).firstName ?? "User";
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
                // We need to access the database to get the active organization
                // This logic was in AuthService.getActiveOrganization
                // Since we don't have AuthService here, we need to replicate the query
                // or find a way to reuse the logic.
                // For now, replicating the simple query.
                const userIdQuery = Types.ObjectId.isValid(session.userId)
                  ? new Types.ObjectId(session.userId)
                  : session.userId;
                const member = await db
                  .collection("member")
                  .findOne({ userId: userIdQuery }, { sort: { createdAt: 1 } });

                let organizationId;
                if (member) {
                  organizationId = member.organizationId;
                }
                return {
                  data: {
                    ...session,
                    activeOrganizationId: organizationId ? organizationId.toString() : undefined, // Convert ObjectId to string since it otherwise is transferred to the frontend as Buffer which causes issues
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
            before: async (data) => {
              // Better-auth's change-email flow is JWT-based: the verification link in the
              // user's new inbox is a stateless, signed token that is not stored in the
              // database, so it cannot be invalidated by deleting any row. To make `revoke`
              // effective, we gate the actual email mutation on the EmailChangeRequest
              // shadow table. `hardCancel` deletes that row, so a revoked link will fail
              // here even if the JWT is still cryptographically valid.
              const newEmail = (data as { email?: unknown } | null | undefined)?.email;
              if (typeof newEmail !== "string") {
                return;
              }
              const pending = await db
                .collection(EMAIL_CHANGE_REQUEST_COLLECTION)
                .findOne({ newEmail });
              if (!pending) {
                logger.warn(
                  `Blocked user.email update to ${newEmail}: no matching EmailChangeRequest (revoked or unknown)`,
                );
                return false;
              }
            },
            after: async (user) => {
              // When better-auth completes a verified email change, user.email is now the new
              // address. Best-effort: delete the matching EmailChangeRequest row. The
              // newEmail filter ensures we only act on completion (other user updates leave
              // user.email unchanged, so no row matches).
              try {
                await db.collection(EMAIL_CHANGE_REQUEST_COLLECTION).deleteOne({
                  userId: user.id,
                  newEmail: user.email,
                });
              } catch (error) {
                logger.error("Failed to clear EmailChangeRequest after user.email update", error);
              }
            },
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

    const isAuthAdminProvided =
      !!configService.get("OPEN_DPP_AUTH_ADMIN_USERNAME") &&
      !!configService.get("OPEN_DPP_AUTH_ADMIN_PASSWORD");
    if (isAuthAdminProvided) {
      const adminUsername = configService.get("OPEN_DPP_AUTH_ADMIN_USERNAME");
      const adminPassword = configService.get("OPEN_DPP_AUTH_ADMIN_PASSWORD");
      try {
        await (auth.api as any).createUser({
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
    logger.log("Auth initialized");

    return auth;
  },
};
