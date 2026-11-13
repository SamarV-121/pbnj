-- Migration: Add created time and a setting to show or hide the modified time
-- Run with: npx wrangler d1 execute DB --remote --file=schema/migrations/008_add_paste_timestamps.sql

ALTER TABLE pastes ADD COLUMN created INTEGER NOT NULL DEFAULT 0;
ALTER TABLE pastes ADD COLUMN show_modified INTEGER NOT NULL DEFAULT 1;

-- Pastes from before this migration have no creation time, so their last update stands in for it
UPDATE pastes SET created = updated WHERE created = 0;
