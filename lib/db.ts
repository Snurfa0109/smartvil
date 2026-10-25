/**
 * @layer Core / Library
 * @role Pengelola koneksi dan query database MySQL
 * @access Server-side Only
 * @description Menginisialisasi connection pool MySQL serta fungsi eksekusi query parameterized yang aman.
 */
import mysql from "mysql2/promise";

const config = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : false,
  connectionLimit: Number(process.env.MYSQL_POOL_LIMIT || 10),
  enableKeepAlive: true,
};

if (!config.host || !config.user || !config.password || !config.database) {
  console.warn(
    "[MySQL] MYSQL_HOST/USER/PASSWORD/DATABASE belum diisi. Isi .env.local dengan kredensial MySQL lokal."
  );
}

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool(config as mysql.PoolOptions);
  }
  return pool;
}

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T> {
  const p = getPool();
  const [rows] = await p.query(sql, params as unknown[]);
  return rows as T;
}
