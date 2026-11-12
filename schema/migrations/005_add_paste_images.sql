-- Migration: Add paste_images table for images attached to pastes
-- Run with: npx wrangler d1 execute pbnj-db --remote --file=schema/migrations/005_add_paste_images.sql
-- paste_id stays NULL until the paste that references the image is saved

CREATE TABLE IF NOT EXISTS paste_images (
  id TEXT PRIMARY KEY,
  paste_id TEXT,
  mime TEXT NOT NULL,
  data BLOB NOT NULL,
  created INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_paste_images_paste_id ON paste_images(paste_id);
