import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce
    .number({ error: "PORT must be a number" })
    .int({ error: "PORT must be a whole number" })
    .min(1, { error: "PORT must be between 1 and 65535" })
    .max(65535, { error: "PORT must be between 1 and 65535" })
    .default(4000),
  MONGODB_URI: z
    .string({ error: "MONGODB_URI is required (see server/.env.example)" })
    .regex(/^mongodb(\+srv)?:\/\//, { error: "MONGODB_URI must start with mongodb:// or mongodb+srv://" }),
});

export type Env = z.infer<typeof envSchema>;

/** Validates environment variables at startup so misconfiguration fails fast with a clear message. */
export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${details}`);
  }
  return result.data;
}
