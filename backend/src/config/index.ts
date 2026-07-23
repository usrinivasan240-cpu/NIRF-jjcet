export const config = {
  port: parseInt(process.env.PORT || "5000"),
  nodeEnv: process.env.NODE_ENV || "development",
  database: { url: process.env.DATABASE_URL || "" },
  jwt: { secret: process.env.JWT_SECRET || "nirf-erp-secret", expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  cors: { origin: process.env.CORS_ORIGIN || "*" },
};
