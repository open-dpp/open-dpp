import { Logger, Provider } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin, apiKey, genericOAuth, organization } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { Connection } from "mongoose";
import { InviteUserToOrganizationMail } from "../email/domain/invite-user-to-organization-mail";
import { PasswordResetMail } from "../email/domain/password-reset-mail";
import { VerifyEmailMail } from "../email/domain/verify-email-mail";
import { EmailService } from "../email/email.service";

export const AUTH = "auth";

export const AuthProvider: Provider = {
  provide: AUTH,
  inject: [EnvService, EmailService, getConnectionToken()],
  useFactory: async (configService: EnvService, emailService: EmailService, mongooseConnection: Connection) => {
    const logger = new Logger("AuthProvider");

    if (mongooseConnection.readyState !== 1) {
      await new Promise<void>((resolve, reject) => {
        function onOpen() {
          mongooseConnection.off("error", onError);
          resolve();
        }

        function onError(error: any) {
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

    const isCloudAuthEnabled = !!configService.get("OPEN_DPP_AUTH_CLOUD_ENABLED");
    let genericOAuthPlugin;
    if (isCloudAuthEnabled) {
      genericOAuthPlugin = genericOAuth({
        config: [
          {
            providerId: configService.get("OPEN_DPP_AUTH_CLOUD_PROVIDER") as string,
            clientId: configService.get("OPEN_DPP_AUTH_CLOUD_CLIENT_ID") as string,
            clientSecret: configService.get("OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET") as string,
            discoveryUrl: configService.get("OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL") as string,
          },
        ],
      });
    }

    const organizationPlugin = organization({
      schema: {
        organization: {
          additionalFields: {
            image: {
              type: "string",
              input: true,
              required: false,
            },
          },
        },
      },
      async sendInvitationEmail(data) {
        try {
          if (!data.organization) {
            logger.error("Organization data is missing in sendInvitationEmail", data);
            return;
          }
          const inviteLink = `${configService.get("OPEN_DPP_URL")}/accept-invitation/${data.id}`;
          await emailService.send(InviteUserToOrganizationMail.create({
            to: data.email,
            subject: "Invitation to join organization",
            templateProperties: {
              link: inviteLink,
              firstName: "User",
              organizationName: data.organization.name,
            },
          }));
        }
        catch (error) {
          logger.error("Failed to send invitation email", error);
        }
      },
    });

    const apiKeyPlugin = apiKey({
      enableSessionForAPIKeys: true,
      rateLimit: {
        enabled: false,
      },
    });

    const adminPlugin = admin({});
    const plugins = [apiKeyPlugin, organizationPlugin, adminPlugin];
    if (genericOAuthPlugin) {
      plugins.push(genericOAuthPlugin as any);
    }

    const auth = betterAuth({
      baseURL: configService.get("OPEN_DPP_URL"),
      basePath: "/api/auth",
      secret: configService.get("OPEN_DPP_AUTH_SECRET"),
      trustedOrigins: [configService.get("OPEN_DPP_URL")],
      logger: {
        disabled: false,
        log: (level, message, ...args) => {
          const formattedMessage
            = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
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
        },
      },
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, token }) => {
          const firstName = (user as any).firstName ?? "User";
          await emailService.send(PasswordResetMail.create({
            to: user.email,
            subject: "Password reset",
            templateProperties: {
              link: `${configService.get("OPEN_DPP_URL")}/password-reset?token=${token}`,
              firstName,
            },
          }));
        },
      },
      emailVerification: {
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }: { user: any; url: string; token: string }) => {
          const firstName = (user as any).firstName ?? "User";
          await emailService.send(VerifyEmailMail.create({
            to: user.email,
            subject: "Verify E-Mail address",
            templateProperties: {
              link: url,
              firstName,
            },
          }));
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
                const member = await db.collection("member").findOne({
                  userId: new ObjectId(session.userId),
                });

                let organizationId;
                if (member) {
                  organizationId = member.organizationId;
                }

                return {
                  data: {
                    ...session,
                    activeOrganizationId: organizationId,
                  },
                };
              }
              catch (error) {
                logger.error("Failed to get active organization for session", error);
                return {
                  data: session,
                };
              }
            },
          },
        },
      },
      hooks: {},
      plugins,
      database: mongodbAdapter(db, {
        client: configService.get("NODE_ENV") === "test" ? undefined : mongoClient,
      }),
    });

    const isAuthAdminProvided = !!configService.get("OPEN_DPP_AUTH_ADMIN_USERNAME") && !!configService.get("OPEN_DPP_AUTH_ADMIN_PASSWORD");
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
      }
      catch (error) {
        if (error instanceof APIError) {
          logger.warn("Account with set admin username already exists and wont be updated.");
        }
        else {
          logger.error("Failed to create admin account", error);
        }
      }
    }
    logger.log("Auth initialized");

    return auth;
  },
};
