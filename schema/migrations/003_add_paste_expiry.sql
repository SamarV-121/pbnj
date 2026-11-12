-- Migration: Add expiry timestamp to pastes
-- Run with: npx wrangler d1 execute pbnj-db --remote --file=schema/migrations/003_add_paste_expiry.sql

ALTER TABLE pastes ADD COLUMN expires_at INTEGER;

CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
