import pool from "./db";

export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TEXT DEFAULT (to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS login_counters (
        id SERIAL PRIMARY KEY,
        user_id INT,
        ip_address VARCHAR(50),
        fail_count INT DEFAULT 0,
        window_start TEXT NOT NULL,
        UNIQUE(user_id, ip_address)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS suspensions (
        id SERIAL PRIMARY KEY,
        user_id INT,
        ip_address VARCHAR(50),
        suspended_until TEXT NOT NULL,
        suspension_type VARCHAR(20) CHECK (suspension_type IN ('USER', 'IP'))
      );
    `);

    console.log("✅ Database initialized");
  } catch (err) {
    console.error("❌ DB initialization failed", err);
  } finally {
    client.release();
  }
}
