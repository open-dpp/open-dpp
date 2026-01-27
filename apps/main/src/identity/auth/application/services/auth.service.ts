import type { Auth, User } from "better-auth";
import type { Connection } from "mongoose";
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { EnvService } from "@open-dpp/env";
import dayjs from "dayjs";
import { Db, MongoClient, ObjectId } from "mongodb";
import { EmailService } from "../../../../email/email.service";
import { AUTH } from "../../auth.provider";

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private readonly configService: EnvService;
  private readonly emailService: EmailService;
  private readonly mongooseConnection: Connection;

  public readonly auth: Auth;
  private db: Db | undefined;
  private client: MongoClient | undefined;

  constructor(
    configService: EnvService,
    emailService: EmailService,
    @InjectConnection()
    mongooseConnection: Connection,
    @Inject(AUTH) private readonly authInstance: Auth,
  ) {
    this.configService = configService;
    this.emailService = emailService;
    this.mongooseConnection = mongooseConnection;
    this.auth = authInstance;
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
    return await this.auth.api.getSession({
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
    return await this.db!.collection("organization").findOne({
      _id: new ObjectId(member.organizationId),
    });
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

  async getOrganizationDataForPermalink(organizationId: string): Promise<{ name: string; image: string } | null> {
    if (!this.db)
      return null;

    // Validate organizationId and prepare ObjectId if possible
    let orgObjectId: ObjectId | null = null;
    try {
      orgObjectId = new ObjectId(organizationId);
    }
    catch {
      // ignore invalid ObjectId; return null if organizationId is not a valid ObjectId
    }
    // Fetch organization to return its name
    if (!orgObjectId) {
      // If we couldn't parse a valid ObjectId for the organization, we cannot fetch the org document reliably
      return null;
    }

    const organization = await this.db.collection("organization").findOne({ _id: orgObjectId });
    if (!organization)
      return null;
    return {
      name: organization.name ?? "",
      image: organization.logo ?? "",
    };
  }

  async getAllOrganizations(): Promise<Array<{ id: string; name: string; image: string; createdAt: string | null }>> {
    if (!this.db)
      return [];

    const organizations = await this.db.collection("organization")
      .find()
      .limit(100)
      .toArray();
    return organizations.map(org => ({
      id: org._id.toString(),
      name: org.name ?? "",
      image: org.logo ?? "",
      createdAt: org.createdAt ? dayjs(org.createdAt).format("DD.MM.YYYY") : null,
    }));
  }

  async onModuleInit() {
    this.db = this.mongooseConnection.db;
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log("Auth Mongo client closed");
    }
  }
}
