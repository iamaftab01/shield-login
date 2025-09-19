import bcrypt from 'bcrypt';
import pool from '../db';
import { WINDOW_MINUTES, USER_THRESHOLD, SUSPEND_MINUTES, IP_THRESHOLD } from '../config/config';

export async function register(email: string, password: string): Promise<string> {
  const hash = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, $3)',
      [email, hash, new Date().toISOString()]
    );
    return 'User registered successfully';
  } finally {
    client.release();
  }
}

export async function login(email: string, password: string, ip: string): Promise<string> {
  const client = await pool.connect();
  try {
    const suspensionCheck = await client.query(
      `SELECT * FROM suspensions 
       WHERE (user_id = (SELECT id FROM users WHERE email=$1) OR ip_address=$2) 
       AND suspended_until > $3`,
      [email, ip, new Date().toISOString()]
    );

    if (suspensionCheck.rowCount && suspensionCheck.rowCount > 0) {
      throw new Error("Account or IP temporarily suspended due to failed attempts");
    }

    const userResponse = await client.query("SELECT * FROM users WHERE email=$1", [email]);

    if (userResponse.rowCount === 0) {
      await handleFailedAttempt(client, null, ip); // pass null for userId
      throw new Error("Invalid credentials");
    }

    const user = userResponse.rows[0];
    const matched = await bcrypt.compare(password, user.password_hash);

    if (!matched) {
      await handleFailedAttempt(client, user.id, ip);
      throw new Error("Invalid credentials");
    }

    await client.query("DELETE FROM login_counters WHERE user_id=$1 AND ip_address=$2", [
      user.id,
      ip,
    ]);

    return "Login successful";
  } finally {
    client.release();
  }
}


// helper function
export async function handleFailedAttempt(client: any, userId: number | null, ip: string) {
  const res = await client.query(
    "SELECT * FROM login_counters WHERE user_id IS NOT DISTINCT FROM $1 AND ip_address=$2",
    [userId, ip]
  );

  if (res.rowCount === 0) {
    await client.query(
      "INSERT INTO login_counters (user_id, ip_address, fail_count, window_start) VALUES ($1, $2, 1, $3)",
      [userId, ip, new Date().toISOString()]
    );
    return;
  }

  const counter = res.rows[0];
  const windowStartTime = Date.parse(counter.window_start);
  const now = Date.now();

  const withinWindow = now < windowStartTime + WINDOW_MINUTES * 60_000;

  if (!withinWindow) {
    await client.query(
      "UPDATE login_counters SET fail_count=1, window_start=$1 WHERE id=$2",
      [new Date().toISOString(), counter.id]
    );
    return;
  }

  const newCount = counter.fail_count + 1;
  await client.query("UPDATE login_counters SET fail_count=$1 WHERE id=$2", [
    newCount,
    counter.id,
  ]);

  if (userId && newCount >= USER_THRESHOLD) {
    await client.query(
      "INSERT INTO suspensions (user_id, ip_address, suspended_until, suspension_type) VALUES ($1, NULL, $2, 'USER')",
      [userId, new Date(Date.now() + SUSPEND_MINUTES * 60_000).toISOString()]
    );
  }

  const ipCountRes = await client.query(
    `SELECT SUM(fail_count) as total 
     FROM login_counters 
     WHERE ip_address=$1 
     AND window_start > $2`,
    [ip, new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString()]
  );

  const totalFails = parseInt(ipCountRes.rows[0].total || "0");

  if (totalFails >= IP_THRESHOLD) {
    await client.query(
      "INSERT INTO suspensions (user_id, ip_address, suspended_until, suspension_type) VALUES (NULL, $1, $2, 'IP')",
      [ip, new Date(Date.now() + SUSPEND_MINUTES * 60_000).toISOString()]
    );
  }
}
