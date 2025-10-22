import type { User } from "better-auth";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { genericOAuth } from "better-auth/plugins";
import { MongoClient, ObjectId } from "mongodb";
import { Subject } from "rxjs";

const client = new MongoClient("mongodb://admin:change-to-secure-mongo-password@localhost:20005/management?authSource=admin");
const db = client.db();

export interface SendEmailData {
  to: User;
  url: string;
}
export const sendEmailSubject = new Subject<SendEmailData>();

export const auth = betterAuth({
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }: { user: User; url: string; token: string }) => {
      sendEmailSubject.next({
        to: user,
        url,
      });
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
  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client,
  }),
});

// Export db for internal queries
export { db };

// Typed helper functions
export async function getUserById(userId: string): Promise<User | null> {
  return await db.collection<User>("user").findOne({ _id: new ObjectId(userId) } as any);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await db.collection<User>("user").findOne({ email });
}
