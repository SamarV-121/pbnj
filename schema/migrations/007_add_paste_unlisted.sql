-- Migration: Add unlisted pastes
-- Run with: npx wrangler d1 execute DB --remote --file=schema/migrations/007_add_paste_unlisted.sql

ALTER TABLE pastes ADD COLUMN is_unlisted INTEGER NOT NULL DEFAULT 0;
