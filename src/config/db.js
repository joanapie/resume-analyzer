import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'resume_analyzer',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         BIGSERIAL PRIMARY KEY,
      email      VARCHAR(255) UNIQUE NOT NULL,
      password   TEXT NOT NULL,
      name       VARCHAR(100) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS resumes (
      id                BIGSERIAL PRIMARY KEY,
      user_id           BIGINT REFERENCES users(id) ON DELETE CASCADE,
      original_filename TEXT NOT NULL,
      resume_text       TEXT,
      job_description   TEXT,
      mode              VARCHAR(20) DEFAULT 'resume',
      analyze_status    VARCHAR(20) DEFAULT 'PENDING',
      analysis_result   TEXT,
      error_message     TEXT,
      share_token       VARCHAR(36) UNIQUE,
      created_at        TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS interview_sessions (
      id         BIGSERIAL PRIMARY KEY,
      user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
      resume_id  BIGINT REFERENCES resumes(id) ON DELETE SET NULL,
      role       VARCHAR(200),
      questions  TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Migrations for existing tables
  const migrations = [
    `ALTER TABLE resumes ADD COLUMN IF NOT EXISTS user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`,
    `ALTER TABLE resumes ADD COLUMN IF NOT EXISTS share_token VARCHAR(36) UNIQUE`,
    `ALTER TABLE resumes ADD COLUMN IF NOT EXISTS job_description TEXT`,
    `ALTER TABLE resumes ADD COLUMN IF NOT EXISTS mode VARCHAR(20) DEFAULT 'resume'`,
  ];
  for (const sql of migrations) {
    await pool.query(sql).catch(() => {});
  }

  console.log('[DB] Tables ready');
}
