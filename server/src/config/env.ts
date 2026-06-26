import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Determine which .env file to load based on NODE_ENV
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  console.log(`[Config] Loading environment variables from ${envFile}`);
  dotenv.config({ path: envPath });
} else {
  console.log(`[Config] ${envFile} not found, falling back to default .env`);
  dotenv.config(); // fallback to standard .env
}

// Define required variables
const REQUIRED_VARS = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "AI_PROVIDER",
  "WORK_START_TIME",
  "ABSENT_MARK_TIME",
  "TIMEZONE",
  "CERTIFICATE_MIN_COMPLETION",
  "CERTIFICATE_MIN_ATTENDANCE"
];

export const validateEnv = (): void => {
  const missing: string[] = [];

  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error(`\n[FATAL] Missing required environment variables: ${missing.join(", ")}`);
    console.error("Please configure them in your active .env file. Exiting...\n");
    process.exit(1);
  }

  // Validate PORT is a number
  const port = Number(process.env.PORT);
  if (isNaN(port)) {
    console.error(`\n[FATAL] Invalid PORT: ${process.env.PORT} is not a number. Exiting...\n`);
    process.exit(1);
  }

  // Validate Certificate thresholds are numbers
  const minComp = Number(process.env.CERTIFICATE_MIN_COMPLETION);
  const minAtt = Number(process.env.CERTIFICATE_MIN_ATTENDANCE);
  if (isNaN(minComp) || minComp < 0 || minComp > 100) {
    console.error(`\n[FATAL] Invalid CERTIFICATE_MIN_COMPLETION: "${process.env.CERTIFICATE_MIN_COMPLETION}" must be a number between 0 and 100. Exiting...\n`);
    process.exit(1);
  }
  if (isNaN(minAtt) || minAtt < 0 || minAtt > 100) {
    console.error(`\n[FATAL] Invalid CERTIFICATE_MIN_ATTENDANCE: "${process.env.CERTIFICATE_MIN_ATTENDANCE}" must be a number between 0 and 100. Exiting...\n`);
    process.exit(1);
  }

  // Validate timing formats (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!timeRegex.test(process.env.WORK_START_TIME!)) {
    console.error(`\n[FATAL] Invalid WORK_START_TIME: "${process.env.WORK_START_TIME}" must be in HH:MM format. Exiting...\n`);
    process.exit(1);
  }
  if (!timeRegex.test(process.env.ABSENT_MARK_TIME!)) {
    console.error(`\n[FATAL] Invalid ABSENT_MARK_TIME: "${process.env.ABSENT_MARK_TIME}" must be in HH:MM format. Exiting...\n`);
    process.exit(1);
  }

  // Validate AI Provider selection
  const provider = process.env.AI_PROVIDER!.toLowerCase();
  if (provider !== "gemini" && provider !== "openai" && provider !== "mock") {
    console.error(`\n[FATAL] Invalid AI_PROVIDER: "${process.env.AI_PROVIDER}". Must be "gemini", "openai", or "mock". Exiting...\n`);
    process.exit(1);
  }

  // If AI Provider is gemini or openai, warn if API keys are missing (but don't necessarily crash in mock fallback setups)
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    console.warn(`[WARNING] AI_PROVIDER is set to "gemini" but GEMINI_API_KEY is empty. AI summaries will fallback to Mock.`);
  }
  if (provider === "openai" && !process.env.OPENAI_API_KEY) {
    console.warn(`[WARNING] AI_PROVIDER is set to "openai" but OPENAI_API_KEY is empty. AI summaries will fallback to Mock.`);
  }

  console.log(`[Config] Environment validated successfully. Mode: ${nodeEnv}`);
};
