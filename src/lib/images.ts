// Helpers for images attached to pastes. Images are stored in D1 as BLOBs.
// An image has paste_id NULL until a paste that references it is saved.

// D1 caps a row at 2,000,000 bytes, so leave room for the other columns
export const MAX_IMAGE_BYTES = 1_990_000;
export const MAX_IMAGES_PER_PASTE = 20;
// Editor downscales anything larger than this on its longest side
export const MAX_IMAGE_DIMENSION = 2048;
export const UNATTACHED_IMAGE_TTL_MS = 24 * 60 * 60 * 1000;

// SVG is excluded because it can run scripts when opened directly
export const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const IMAGE_ID_PATTERN = /^[0-9a-f]{32}$/;

export function generateImageId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Returns the de-duplicated list of image IDs, or null if the value is malformed
export function parseImageIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > MAX_IMAGES_PER_PASTE) {
    return null;
  }

  const ids: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !IMAGE_ID_PATTERN.test(id)) {
      return null;
    }
    if (!ids.includes(id)) {
      ids.push(id);
    }
  }
  return ids;
}

// Claims unattached images for a paste. Images already on another paste are
// skipped, and unknown IDs are ignored.
export function attachImagesStatements(db: any, pasteId: string, ids: string[]) {
  return ids.map(id =>
    db.prepare('UPDATE paste_images SET paste_id = ? WHERE id = ? AND (paste_id IS NULL OR paste_id = ?)')
      .bind(pasteId, id, pasteId)
  );
}

// Deletes the paste's images that are not in keepIds
export function detachImagesStatement(db: any, pasteId: string, keepIds: string[]) {
  if (keepIds.length === 0) {
    return db.prepare('DELETE FROM paste_images WHERE paste_id = ?').bind(pasteId);
  }

  const placeholders = keepIds.map(() => '?').join(', ');
  return db.prepare(`DELETE FROM paste_images WHERE paste_id = ? AND id NOT IN (${placeholders})`)
    .bind(pasteId, ...keepIds);
}

// Removes abandoned uploads and images whose paste no longer exists
export async function deleteStaleImages(db: any, now: number): Promise<void> {
  await db.prepare(
    'DELETE FROM paste_images WHERE (paste_id IS NULL AND created <= ?) OR (paste_id IS NOT NULL AND paste_id NOT IN (SELECT id FROM pastes))'
  )
    .bind(now - UNATTACHED_IMAGE_TTL_MS)
    .run();
}
