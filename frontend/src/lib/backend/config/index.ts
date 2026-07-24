import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "5000"),
  nodeEnv: process.env.NODE_ENV || "development",
  jwt: {
    secret: process.env.JWT_SECRET || "nirf-jwt-secret-key-2024",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: { origin: process.env.CORS_ORIGIN || "*" },
};
