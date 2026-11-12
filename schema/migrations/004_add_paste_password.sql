-- Migration: Add password hash to pastes
-- Run with: npx wrangler d1 execute pbnj-db --remote --file=schema/migrations/004_add_paste_password.sql

ALTER TABLE pastes ADD COLUMN password_hash TEXT;
