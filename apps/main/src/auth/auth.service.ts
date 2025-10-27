import type { Auth } from "better-auth";
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EnvService } from "@open-dpp/env";
import { betterAuth, User } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { Db, MongoClient, ObjectId } from "mongodb";
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

    this.auth = betterAuth({
      basePath: "/api/auth",
      trustedOrigins: ["http://localhost:5173"],
      emailAndPassword: {
        enabled: true,
      },
      emailVerification: {
        sendOnSignUp: true,
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
      plugins: [
        genericOAuth({
          config: [
            {
              providerId: "auth.demo1.open-dpp.de",
              clientId: "local-better-auth",
              clientSecret: "n3WtPDDbZ95qY2wmO91XXk2oTbAdhyKW",
              discoveryUrl: "https://auth.demo1.open-dpp.de/realms/open-dpp/.well-known/openid-configuration",
              // ... other config options
            },
            // Add more providers as needed
          ],
        }),
      ],
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
