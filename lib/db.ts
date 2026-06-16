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

    // Run migrations in the background asynchronously to prevent blocking pool startup
    runDbMigrations(global.__campusDbPool).catch((err) => {
      console.error("Background DB migrations failed:", err);
    });
  }

  return global.__campusDbPool;
}

async function runDbMigrations(pool: mysql.Pool) {
  try {
    // 1. Check & Add appointments exchange columns
    const [appCols] = await pool.query<any[]>(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'exchange_mode'`
    );
    if (appCols.length === 0) {
      console.log("Migrating appointments table: Adding exchange_mode & exchange_value...");
      await pool.query("ALTER TABLE appointments ADD COLUMN exchange_mode VARCHAR(24) NOT NULL DEFAULT 'price' AFTER amount");
      await pool.query("ALTER TABLE appointments ADD COLUMN exchange_value VARCHAR(255) NULL AFTER exchange_mode");
    }

    // 1.5 Check & Add appointments unread columns
    const [unreadCols] = await pool.query<any[]>(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' AND COLUMN_NAME = 'buyer_unread'`
    );
    if (unreadCols.length === 0) {
      console.log("Migrating appointments table: Adding buyer_unread & seller_unread...");
      await pool.query("ALTER TABLE appointments ADD COLUMN buyer_unread TINYINT(1) NOT NULL DEFAULT 0");
      await pool.query("ALTER TABLE appointments ADD COLUMN seller_unread TINYINT(1) NOT NULL DEFAULT 0");
    }

    // 2. Check & Add chat_messages.is_read
    const [chatCols] = await pool.query<any[]>(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'is_read'`
    );
    if (chatCols.length === 0) {
      console.log("Migrating chat_messages table: Adding is_read...");
      await pool.query("ALTER TABLE chat_messages ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0");
    }

    // 2.5 Check & Add chat_messages.is_edited
    const [editedCols] = await pool.query<any[]>(
      `SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'chat_messages' AND COLUMN_NAME = 'is_edited'`
    );
    if (editedCols.length === 0) {
      console.log("Migrating chat_messages table: Adding is_edited...");
      await pool.query("ALTER TABLE chat_messages ADD COLUMN is_edited TINYINT(1) NOT NULL DEFAULT 0");
    }

    // 2.7 Check & Create email_verifications table
    const [verifTables] = await pool.query<any[]>(
      `SHOW TABLES LIKE 'email_verifications'`
    );
    if (verifTables.length === 0) {
      console.log("Migrating database: Creating email_verifications table...");
      await pool.query(
        `CREATE TABLE email_verifications (
          email VARCHAR(255) PRIMARY KEY,
          code VARCHAR(6) NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      );
    }

    // 3. Check & Add '其他' category
    const [existingOtherCategory] = await pool.query<any[]>(
      `SELECT 1 FROM categories WHERE name = '其他' OR slug = 'other'`
    );
    if (existingOtherCategory.length === 0) {
      console.log("Seeding '其他' category...");
      await pool.query("INSERT INTO categories (name, slug, sort_order) VALUES ('其他', 'other', 99)");
    }
  } catch (error) {
    console.error("Database self-healing migration failed:", error);
  }
}

