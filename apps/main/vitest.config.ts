import { defineConfig, mergeConfig } from "vitest/config";
import shared from "../../vitest.shared";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      include: ["src/**/*.spec.ts", "test/**/*.spec.ts"],
      // Starts the one MongoMemoryReplSet every spec file shares and provides its URI.
      globalSetup: ["./test/global-setup.ts"],
      // Runs in each spec file's process before the spec: Mongo URI, supertest loopback.
      setupFiles: ["./test/setup-file.ts"],
      // Wins over the shell and CI environment, so every run sees the same configuration.
      // NODE_ENV=test is load-bearing: `generateMongoConfig` only then gives each spec file
      // its own database.
      env: {
        NODE_ENV: "test",
        OPEN_DPP_URL: "http://localhost:3000",
        OPEN_DPP_PERMALINK_BASE_URL: "http://localhost:3000/p",
        OPEN_DPP_MONGODB_USER: "admin",
        OPEN_DPP_MONGODB_PASSWORD: "admin",
        OPEN_DPP_MONGODB_DATABASE: "test",
        OPEN_DPP_MISTRAL_API_KEY: "test-mistral-key",
        OPEN_DPP_S3_ENDPOINT: "localhost",
        OPEN_DPP_S3_PORT: "9000",
        OPEN_DPP_S3_SSL: "false",
        OPEN_DPP_S3_ACCESS_KEY: "rustfsadmin",
        OPEN_DPP_S3_SECRET_KEY: "rustfsadmin",
        OPEN_DPP_S3_DEFAULT_BUCKET: "dpp",
        OPEN_DPP_S3_PROFILE_PICTURE_BUCKET: "profile-pictures",
        OPEN_DPP_MAIL_HOST: "localhost",
        OPEN_DPP_MAIL_PORT: "1025",
        OPEN_DPP_MAIL_USER: "admin",
        OPEN_DPP_MAIL_PASSWORD: "admin",
        OPEN_DPP_MAIL_SENDER_ADDRESS: "test@open-dpp.de",
        OPEN_DPP_AUTH_SECRET: "test-auth-secret",
      },
      // Nest testing modules against Mongo take a while to build in `beforeAll`, so hooks
      // get the same ceiling as tests (Vitest's hook default is 10 s).
      testTimeout: 45_000,
      hookTimeout: 45_000,
      coverage: {
        exclude: ["src/main.ts"],
      },
    },
  }),
);
