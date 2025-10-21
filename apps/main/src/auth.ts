import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://admin:change-to-secure-mongo-password@localhost:20005/management?authSource=admin");
const db = client.db();

export const auth = betterAuth({
  basePath: "/api/auth",
  trustedOrigins: ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [admin()],
  database: mongodbAdapter(db, {
    // Optional: if you don't provide a client, database transactions won't be enabled.
    client,
  }),
});
