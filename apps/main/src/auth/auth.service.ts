import type { Auth } from "better-auth";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { betterAuth, User } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { Db, MongoClient, ObjectId } from "mongodb";
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

  async onModuleInit() {
    const mongoUser = this.configService.get("OPEN_DPP_MONGODB_USER");
    const mongoPassword = this.configService.get("OPEN_DPP_MONGODB_PASSWORD");
    const mongoHost = this.configService.get("OPEN_DPP_MONGODB_HOST");
    const mongoPort = this.configService.get("OPEN_DPP_MONGODB_PORT");
    const mongoDb = this.configService.get("OPEN_DPP_MONGODB_DATABASE");
    const mongoUri = `mongodb://${encodeURIComponent(mongoUser)}:${encodeURIComponent(mongoPassword)}@${mongoHost}:${mongoPort}/${mongoDb}?authSource=${mongoUser}`;
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

    const migrationEnabled = !!this.configService.get("OPEN_DPP_MIGRATE_KEYCLOAK_ENABLED");

    this.auth = betterAuth({
      baseURL: this.configService.get("OPEN_DPP_URL"),
      basePath: "/api/auth",
      secret: this.configService.get("OPEN_DPP_AUTH_SECRET"),
      trustedOrigins: [this.configService.get("OPEN_DPP_URL")],
      emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url, token }) => {
          await this.emailService.send(PasswordResetMail.create({
            to: user.email,
            subject: "Password reset",
            templateProperties: {
              link: `${this.configService.get("OPEN_DPP_URL")}/password-reset?token=${token}`,
              firstName: user.name ?? "User",
            },
          }));
        },
      },
      emailVerification: {
        sendOnSignUp: !migrationEnabled,
        sendVerificationEmail: async ({ user, url }: { user: User; url: string; token: string }) => {
          await this.emailService.send(VerifyEmailMail.create({
            to: user.email,
            subject: "Verify E-Mail address",
            templateProperties: {
              link: url,
              firstName: user.name ?? "User",
            },
          }));
        },
      },
      hooks: {},
      plugins: genericOAuthPlugin ? [genericOAuthPlugin] : [],
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
