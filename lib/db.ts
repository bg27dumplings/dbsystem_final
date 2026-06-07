import "server-only";
import mysql from "mysql2/promise";

declare global {
  // eslint-disable-next-line no-var
  var __campusDbPool: mysql.Pool | undefined;
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDbPool() {
  if (!global.__campusDbPool) {
    global.__campusDbPool = mysql.createPool({
      host: requireEnv("DB_HOST"),
      port: Number(requireEnv("DB_PORT")),
      database: requireEnv("DB_NAME"),
      user: requireEnv("DB_USER"),
      password: requireEnv("DB_PASS"),
      charset: "utf8mb4",
      connectionLimit: 10,
      namedPlaceholders: true
    });
  }

  return global.__campusDbPool;
}
