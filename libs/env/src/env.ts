import { z } from 'zod';

const envSchema = z.object({
  // Common
  OPEN_DPP_PORT: z.coerce.number().optional().default(3000),
  OPEN_DPP_URL: z.url(),
  OPEN_DPP_SERVICE_TOKEN: z.coerce.string().min(16),
  OPEN_DPP_MSG_PORT: z.coerce.number().optional().default(5002),
  // MongoDB
  OPEN_DPP_MONGODB_PORT: z.coerce.number(),
  OPEN_DPP_MONGODB_HOST: z.coerce.string(),
  OPEN_DPP_MONGODB_USER: z.coerce.string(),
  OPEN_DPP_MONGODB_PASSWORD: z.coerce.string(),
  OPEN_DPP_MONGODB_DATABASE: z.coerce.string(),
  // Postgres
  OPEN_DPP_DB_PORT: z.coerce.number(),
  OPEN_DPP_DB_HOST: z.coerce.string(),
  OPEN_DPP_DB_USER: z.coerce.string(),
  OPEN_DPP_DB_PASSWORD: z.coerce.string(),
  OPEN_DPP_DB_DATABASE: z.coerce.string(),
  // AI
  OPEN_DPP_MISTRAL_API_KEY: z.coerce.string(),
  OPEN_DPP_OLLAMA_URL: z.url(),
  OPEN_DPP_MCP_URL: z.url(),
  // Keycloak
  OPEN_DPP_KEYCLOAK_URL: z.url(),
  OPEN_DPP_KEYCLOAK_REALM: z.coerce.string(),
  OPEN_DPP_KEYCLOAK_USER: z.coerce.string(),
  OPEN_DPP_KEYCLOAK_PASSWORD: z.coerce.string(),
  OPEN_DPP_KEYCLOAK_JWT_AUDIENCE: z.coerce.string(),
  // S3
  OPEN_DPP_S3_ENDPOINT: z.coerce.string(),
  OPEN_DPP_S3_PORT: z.coerce.number(),
  OPEN_DPP_S3_SSL: z.coerce.boolean(),
  OPEN_DPP_S3_ACCESS_KEY: z.coerce.string(),
  OPEN_DPP_S3_SECRET_KEY: z.coerce.string(),
  OPEN_DPP_S3_DEFAULT_BUCKET: z.coerce.string(),
  OPEN_DPP_S3_PROFILE_PICTURE_BUCKET: z.coerce.string(),
  // ClamAV
  OPEN_DPP_CLAMAV_URL: z.coerce.string(),
  OPEN_DPP_CLAMAV_PORT: z.coerce.number(),
  // Misc
  OPEN_DPP_BUILD_API_DOC: z.coerce.boolean().optional().default(false),
  OPEN_DPP_JSON_LIMIT_DEFAULT: z.coerce
    .string()
    .or(z.number())
    .optional()
    .default('10mb'),
  OPEN_DPP_JSON_LIMIT_INTEGRATION: z.coerce
    .string()
    .or(z.number())
    .optional()
    .default('50mb'),
});

export function validateEnv(env: Record<string, any>): Record<string, any> {
  const result = envSchema.safeParse(env);

  if (result.error) {
    throw new Error(
      'Environment is not properly configured: \n' +
        z.prettifyError(result.error),
    );
  }

  return result;
}

export type Env = z.infer<typeof envSchema>;
