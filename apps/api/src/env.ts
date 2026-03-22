import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  API_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  // Auth
  AUTH_SECRET: z.string().min(32),
  COOKIE_DOMAIN: z.string().default("localhost"),

  // Redis
  REDIS_URL: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().default("MedFlow <noreply@medflow.com>"),

  // LiveKit
  LIVEKIT_URL: z.string().min(1),
  LIVEKIT_API_KEY: z.string().min(1),
  LIVEKIT_API_SECRET: z.string().min(1),

  // R2
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().default("medflow-documents"),
  R2_PUBLIC_URL: z.string().url(),

  // Frontend
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  // Encryption (hex string for AES-256 key, 32 bytes = 64 hex chars)
  ENCRYPTION_KEY: z.string().length(64),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
