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
  password_hash TEXT,
  max_reads INTEGER,
  read_count INTEGER NOT NULL DEFAULT 0
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

-- Images attached to pastes. paste_id stays NULL until the paste is saved.
CREATE TABLE IF NOT EXISTS paste_images (
  id TEXT PRIMARY KEY,
  paste_id TEXT,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paste_images_paste_id ON paste_images(paste_id);
