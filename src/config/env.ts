import dotenv from "dotenv";

dotenv.config();

export const config = {
  server: {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || "default_secret",
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
  },
};
