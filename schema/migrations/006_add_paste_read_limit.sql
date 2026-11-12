-- Migration: Add read limits to pastes
-- Run with: npx wrangler d1 execute pbnj-db --remote --file=schema/migrations/006_add_paste_read_limit.sql

ALTER TABLE pastes ADD COLUMN max_reads INTEGER;
ALTER TABLE pastes ADD COLUMN read_count INTEGER NOT NULL DEFAULT 0;
