-- D1 Database Schema for pbnj.sh
-- Run this with: wrangler d1 execute pbnj-db --remote --file=./schema/schema.sql

CREATE TABLE IF NOT EXISTS pastes (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  language TEXT,
  updated INTEGER NOT NULL,
  filename TEXT,
  is_private INTEGER DEFAULT 0,
  secret_key TEXT,
  expires_at INTEGER,
  password_hash TEXT
);

CREATE INDEX IF NOT EXISTS idx_updated ON pastes(updated DESC);
CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);

-- Sessions table for web authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);
