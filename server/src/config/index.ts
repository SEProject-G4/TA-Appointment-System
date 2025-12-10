import dotenv = require("dotenv");

dotenv.config();

interface Config {
  PORT: string | undefined;
  SESSION_SECRET: string | undefined;
  FRONTEND_URL: string | undefined;
  BACKEND_URL: string | undefined;
  MONGO_URI: string | undefined;
  GOOGLE_CLIENT_ID: string | undefined;
  GOOGLE_CLIENT_SECRET: string | undefined;
  GMAIL_USER: string | undefined;
  GMAIL_PASS: string | undefined;
  REDIS_URL: string | undefined;
  ENFORCE_EMAIL_DOMAIN: boolean;
  ALLOWED_EMAIL_DOMAIN: string;
}

const config: Config = {
  PORT: process.env.PORT,
  SESSION_SECRET: process.env.SESSION_SECRET,

  FRONTEND_URL: process.env.FRONTEND_URL,
  BACKEND_URL: process.env.BACKEND_URL,

  MONGO_URI: process.env.MONGO_URI,

  //Google OAuth configuration
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,

  // Email configuration
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_PASS: process.env.GMAIL_PASS,

  // Redis Cloud configuration
  REDIS_URL: process.env.REDIS_URL,
  ENFORCE_EMAIL_DOMAIN: process.env.ENFORCE_EMAIL_DOMAIN
    ? process.env.ENFORCE_EMAIL_DOMAIN === "true"
    : false,
  ALLOWED_EMAIL_DOMAIN: process.env.ALLOWED_EMAIL_DOMAIN || "cse.mrt.ac.lk",
};

module.exports = config;
