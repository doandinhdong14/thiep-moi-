import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  APP_NAME: z.string().default("Ding Dong Gift"),
  APP_TIMEZONE: z.string().default("Asia/Ho_Chi_Minh"),
  DATABASE_URL: z.string().default("file:./dev.db"),
  SESSION_SECRET: z.string().default("dev_session_secret_at_least_32_characters_long_for_security"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  LOCAL_STORAGE_DIR: z.string().default("./public/uploads"),
  EMAIL_PROVIDER: z.enum(["console", "resend"]).default("console"),
  EMAIL_FROM: z.string().default("no-reply@dingdonggift.com"),
  PAYMENT_MODE: z.string().default("manual_review"),
  PAYMENT_PROVIDER: z.string().default("payos"),
  PAYMENT_WEBHOOK_SECRET: z.string().default("08aa3c5ec83222d11ac305b0547facff3994501c28df5ff2776e7ca696b4a061"),
  BANK_TRANSFER_DISPLAY_NAME: z.string().default("CONG TY CP DING DONG GIFT VN"),
  BANK_TRANSFER_ACCOUNT_NUMBER: z.string().default("19036789123456"),
  BANK_TRANSFER_BANK_CODE: z.string().default("TCB"),
  GIFT_CARD_ACTIVATION_PEPPER: z.string().default("dingdonggift_dev_gift_card_pepper_secret_value_2026"),
  RATE_LIMIT_ENABLED: z.string().default("true"),
  PAYOS_CLIENT_ID: z.string().optional(),
  PAYOS_API_KEY: z.string().optional(),
  PAYOS_CHECKSUM_KEY: z.string().optional(),
  PAYOS_WEBHOOK_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
