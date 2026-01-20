import { z } from "zod";

const asBoolean = z.string().transform(val => val.toLowerCase() === "true");

export const envSchema = z.object({
  // Misc
  NODE_ENV: z.coerce.string().optional(),
  // Common
  OPEN_DPP_PORT: z.coerce.number().max(65535).min(0).optional().default(3000),
  OPEN_DPP_URL: z.url(),
  OPEN_DPP_SERVICE_TOKEN: z.coerce.string().min(16),
  OPEN_DPP_AAS_TOKEN: z.coerce.string().min(16),
  OPEN_DPP_MSG_PORT: z.coerce.number().optional().default(5002),
  OPEN_DPP_LOG_FORMAT: z.enum(["json", "plain"]).optional().default("plain"),
  // MongoDB
  OPEN_DPP_MONGODB_URI: z.coerce.string().optional(),
  OPEN_DPP_MONGODB_PORT: z.coerce.number().max(65535).min(0).optional(),
  OPEN_DPP_MONGODB_HOST: z.coerce.string().optional(),
  OPEN_DPP_MONGODB_USER: z.coerce.string(),
  OPEN_DPP_MONGODB_PASSWORD: z.coerce.string(),
  OPEN_DPP_MONGODB_DATABASE: z.coerce.string(),
  // AI
  OPEN_DPP_MISTRAL_API_KEY: z.coerce.string(),
  OPEN_DPP_OLLAMA_URL: z.url(),
  OPEN_DPP_MCP_URL: z.url(),
  // S3
  OPEN_DPP_S3_ENDPOINT: z.coerce.string(),
  OPEN_DPP_S3_PORT: z.coerce.number().max(65535).min(0),
  OPEN_DPP_S3_SSL: asBoolean,
  OPEN_DPP_S3_ACCESS_KEY: z.coerce.string(),
  OPEN_DPP_S3_SECRET_KEY: z.coerce.string(),
  OPEN_DPP_S3_DEFAULT_BUCKET: z.coerce.string(),
  OPEN_DPP_S3_PROFILE_PICTURE_BUCKET: z.coerce.string(),
  // ClamAV
  OPEN_DPP_CLAMAV_URL: z.coerce.string(),
  OPEN_DPP_CLAMAV_PORT: z.coerce.number().max(65535).min(0),
  // MCP
  OPEN_DPP_MCP_PORT: z.coerce.number().max(65535).min(0),
  // Misc
  OPEN_DPP_BUILD_API_DOC: asBoolean.optional().default(false),
  OPEN_DPP_JSON_LIMIT_DEFAULT: z.coerce
    .string()
    .or(z.number())
    .optional()
    .default("10mb"),
  OPEN_DPP_JSON_LIMIT_INTEGRATION: z.coerce
    .string()
    .or(z.number())
    .optional()
    .default("50mb"),
  // Mail
  OPEN_DPP_MAIL_HOST: z.coerce.string(),
  OPEN_DPP_MAIL_PORT: z.coerce.number().max(65535).min(0),
  OPEN_DPP_MAIL_USER: z.coerce.string(),
  OPEN_DPP_MAIL_PASSWORD: z.coerce.string(),
  OPEN_DPP_MAIL_SENDER_ADDRESS: z.coerce.string(),
  OPEN_DPP_MAIL_MAILPIT_SMTP_AUTH: z.coerce.string().optional(),
  OPEN_DPP_MAIL_MAILPIT_SMTP_ALLOW_INSECURE: z.coerce.string().optional(),
  // Auth
  OPEN_DPP_AUTH_SECRET: z.coerce.string(),
  OPEN_DPP_AUTH_CLOUD_ENABLED: asBoolean.optional(),
  OPEN_DPP_AUTH_CLOUD_PROVIDER: z.string().optional(),
  OPEN_DPP_AUTH_CLOUD_CLIENT_ID: z.string().optional(),
  OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET: z.string().optional(),
  OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL: z.string().optional(),
  OPEN_DPP_AUTH_ADMIN_USERNAME: z.string().optional(),
  OPEN_DPP_AUTH_ADMIN_PASSWORD: z.string().optional(),
  // Default Caps
  OPEN_DPP_DEFAULT_MODEL_CREATE_CAP: z.coerce.number().min(0).optional().default(0),
  OPEN_DPP_DEFAULT_AI_TOKEN_QUOTA: z.coerce.number().min(0).optional().default(0),
  OPEN_DPP_DEFAULT_MEDIA_STORAGE_CAP: z.coerce.number().min(0).optional().default(0),
}).superRefine((val, ctx) => {
  const hasUri = !!val.OPEN_DPP_MONGODB_URI;
  const hasHostPort = !!val.OPEN_DPP_MONGODB_HOST && !!val.OPEN_DPP_MONGODB_PORT;
  if (!hasUri && !hasHostPort) {
    ctx.addIssue({
      code: "custom",
      message: "Provide either OPEN_DPP_MONGODB_URI or both OPEN_DPP_MONGODB_HOST and OPEN_DPP_MONGODB_PORT.",
      path: ["OPEN_DPP_MONGODB_URI"],
    });
  }
  // if open-dpp cloud as auth provider is enabled, env must be prepared for it
  const isAuthCloudEnabled = !!val.OPEN_DPP_AUTH_CLOUD_ENABLED;
  if (isAuthCloudEnabled) {
    const hasAuthCloudProvider = !!val.OPEN_DPP_AUTH_CLOUD_PROVIDER;
    const hasAuthCloudClientId = !!val.OPEN_DPP_AUTH_CLOUD_CLIENT_ID;
    const hasAuthCloudClientSecret = !!val.OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET;
    const hasAuthCloudDiscoveryUrl = !!val.OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL;
    if (!hasAuthCloudProvider || !hasAuthCloudClientId || !hasAuthCloudClientSecret || !hasAuthCloudDiscoveryUrl) {
      ctx.addIssue({
        code: "custom",
        message: "OPEN_DPP_AUTH_CLOUD_ENABLED is set to true but not correctly configured. Please check the following env variables:",
        path: ["OPEN_DPP_AUTH_CLOUD_PROVIDER", "OPEN_DPP_AUTH_CLOUD_CLIENT_ID", "OPEN_DPP_AUTH_CLOUD_CLIENT_SECRET", "OPEN_DPP_AUTH_CLOUD_DISCOVERY_URL"],
      });
    }
  }
  const hasAuthAdminUsername = !!val.OPEN_DPP_AUTH_ADMIN_USERNAME;
  const hasAuthAdminPassword = !!val.OPEN_DPP_AUTH_ADMIN_PASSWORD;
  if ((hasAuthAdminUsername && !hasAuthAdminPassword) || (!hasAuthAdminUsername && hasAuthAdminPassword)) {
    ctx.addIssue({
      code: "custom",
      message: "Provide both OPEN_DPP_AUTH_ADMIN_USERNAME and OPEN_DPP_AUTH_ADMIN_PASSWORD if you provide at least one of both.",
      path: ["OPEN_DPP_AUTH_ADMIN_USERNAME", "OPEN_DPP_AUTH_ADMIN_PASSWORD"],
    });
  }
});

export function validateEnv(env: Record<string, any>): Record<string, any> {
  const result = envSchema.safeParse(env);

  if (result.error) {
    throw new Error(
      `Environment is not properly configured: \n${
        z.prettifyError(result.error)}`,
    );
  }

  return result.data;
}

export type Env = z.infer<typeof envSchema>;

export type NumericEnvKeys = Exclude<{
  [K in keyof Env]: Env[K] extends number ? K : never;
}[keyof Env], undefined>;
