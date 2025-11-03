import type { Auth } from "better-auth";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { betterAuth, User } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { apiKey, genericOAuth, organization } from "better-auth/plugins";
import { Db, MongoClient, ObjectId } from "mongodb";
import { InviteUserToOrganizationMail } from "../email/domain/invite-user-to-organization-mail";
import { PasswordResetMail } from "../email/domain/password-reset-mail";
import { VerifyEmailMail } from "../email/domain/verify-email-mail";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private readonly configService: EnvService;
  private readonly emailService: EmailService;

  public auth: Auth | undefined;
  private db: Db | undefined;
  private client: MongoClient | undefined;

  constructor(
    configService: EnvService,
    emailService: EmailService,
  ) {
    this.configService = configService;
    this.emailService = emailService;
  }

  async getUserById(userId: string): Promise<User | null> {
    return await this.db!.collection<User>("user").findOne({ _id: new ObjectId(userId) } as any);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db!.collection<User>("user").findOne({ email });
  }

  async setUserEmailVerified(email: string, emailVerified: boolean): Promise<void> {
    await this.db!.collection<User>("user").updateOne({
      email,
    }, {
      $set: {
        emailVerified,
      },
    });
  }

  async getSession(headers: Headers) {
    return this.auth!.api.getSession({
      headers,
    });
  }

  async isMemberOfOrganization(userId: string, organizationId: string): Promise<boolean> {
    const member = await this.db!.collection("member").findOne({
      userId: new ObjectId(userId),
      organizationId: new ObjectId(organizationId),
    });
    return !!member;
  }

  async getActiveOrganization(userId: string) {
    // Get the member record for the user
    const member = await this.db!.collection("member").findOne({
      userId: new ObjectId(userId),
    });

    if (!member) {
      return null;
    }

    // Get the organization details
    const organization = await this.db!.collection("organization").findOne({
      _id: new ObjectId(member.organizationId),
    });

    return organization;
  }

  async getOrganizationNameIfUserInvited(organizationId: string, userEmail: string): Promise<string | null> {
    if (!this.db)
      return null;

    // Validate organizationId and prepare ObjectId if possible
    let orgObjectId: ObjectId | null = null;
    try {
      orgObjectId = new ObjectId(organizationId);
    }
    catch {
      // ignore invalid ObjectId; we'll still try string match in invitation lookup
    }

    // Check for a pending (open) invitation for this user to this organization
    const now = new Date();
    const invitationFilter: any = {
      email: userEmail,
      status: "pending",
    };

    // Support both string and ObjectId storage for organizationId
    invitationFilter.$and = [
      {
        $or: [
          { organizationId },
          ...(orgObjectId ? [{ organizationId: orgObjectId }] : []),
        ],
      },
      {
        $or: [
          { expiresAt: { $gt: now } },
          { expiresAt: null },
          { expiresAt: { $exists: false } },
        ],
      },
    ];

    const invitation = await this.db.collection("invitation").findOne(invitationFilter);
    if (!invitation) {
      return null;
    }

    // Fetch organization to return its name
    if (!orgObjectId) {
      // If we couldn't parse a valid ObjectId for the organization, we cannot fetch the org document reliably
      return null;
    }

    const organization = await this.db.collection("organization").findOne({ _id: orgObjectId });
    if (!organization)
      return null;
    return (organization as any).name ?? null;
  }

  async onModuleInit() {
    const mongoUser = this.configService.get("OPEN_DPP_MONGODB_USER");
    const mongoPassword = this.configService.get("OPEN_DPP_MONGODB_PASSWORD");
    const mongoHost = this.configService.get("OPEN_DPP_MONGODB_HOST");
    const mongoPort = this.configService.get("OPEN_DPP_MONGODB_PORT");
    const mongoDb = this.configService.get("OPEN_DPP_MONGODB_DATABASE");
    const mongoUriEnv = this.configService.get("OPEN_DPP_MONGODB_URI");
    const mongoUri = mongoUriEnv ?? `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=${mongoUser}`;
    console.log(mongoUri);
    this.client = new MongoClient(mongoUri);
    await this.client.connect();
    this.db = this.client.db();

    const isCloudAuthEnabled = !!this.configService.get("OPEN_DPP_AUTH_CLOUD_ENABLED");
    let genericOAuthPlugin;
    if (isCloudAuthEnabled) {
      genericOAuthPlugin = genericOAuth({
        config: [
          {
            providerId: this.configService.get("OPEN_DPP_AUTH_CLOUD_PROVIDER") as string,
            clientId: this.configService.get("OPEN_DPP_AUTH_CLOUD_CLIENT_ID") as string,
            clientSecret: this.configService.get("OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET") as string,
            discoveryUrl: this.configService.get("OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL") as string,
          },
        ],
      });
    }
    const emailSvc = this.emailService;
    const configSvc = this.configService;
    const organizationPlugin = organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${configSvc.get("OPEN_DPP_URL")}/accept-invitation/${data.id}`;
        await emailSvc.send(InviteUserToOrganizationMail.create({
          to: data.email,
          subject: "Invitation to join organization",
          templateProperties: {
            link: inviteLink,
            firstName: "User",
            organizationName: data.organization.name,
          },
        }));
      },
    });

    const apiKeyPlugin = apiKey({
      enableSessionForAPIKeys: true,
    });

    const migrationEnabled = !!this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_ENABLED");

    this.auth = betterAuth({
      baseURL: this.configService.get("OPEN_DPP_URL"),
      basePath: "/api/auth",
      secret: this.configService.get("OPEN_DPP_AUTH_SECRET"),
      trustedOrigins: [this.configService.get("OPEN_DPP_URL")],
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
          await this.emailService.send(PasswordResetMail.create({
            to: user.email,
            subject: "Password reset",
            templateProperties: {
              link: `${this.configService.get("OPEN_DPP_URL")}/password-reset?token=${token}`,
              firstName,
            },
          }));
        },
      },
      emailVerification: {
        sendOnSignUp: !migrationEnabled,
        sendVerificationEmail: async ({ user, url }: { user: User; url: string; token: string }) => {
          const firstName = (user as any).firstName ?? "User";
          await this.emailService.send(VerifyEmailMail.create({
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
              const organization = await this.getActiveOrganization(session.userId);
              return {
                data: {
                  ...session,
                  activeOrganizationId: organization?._id,
                },
              };
            },
          },
        },
      },
      hooks: {},
      plugins: genericOAuthPlugin ? [genericOAuthPlugin, organizationPlugin, apiKeyPlugin] : [organizationPlugin, apiKeyPlugin],
      database: mongodbAdapter(this.db, {
        client: this.client,
      }),
    });
    this.logger.log("Auth initialized");
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log("Auth Mongo client closed");
    }
  }
}
