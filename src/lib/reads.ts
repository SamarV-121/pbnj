// Read limits let a paste burn itself after a set number of page views.
// Only unlocked page views (/:id) by people who aren't logged in count.

export const MAX_READ_LIMIT = 1_000_000;

// A burned paste keeps its images for this long so the page can finish loading
export const BURN_GRACE_MS = 5 * 60 * 1000;

// Matches pastes that still have reads left. Unlimited pastes have a NULL limit.
export const NOT_BURNED_SQL = '(max_reads IS NULL OR read_count < max_reads)';

// Returns null for no limit, the validated limit, or undefined if the value is invalid
export function parseMaxReads(value: unknown): number | null | undefined {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const limit = typeof value === 'number' || typeof value === 'string' ? Number(value) : NaN;
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_READ_LIMIT) {
    return undefined;
  }
  return limit;
}

// Counts one read and burns the paste on its last read. Returns false if no read was left to count.
export async function countRead(db: any, id: string): Promise<boolean> {
  const now = Date.now();
  const graceEnd = now + BURN_GRACE_MS;
  // The CASE expressions use the pre-update read_count. Burning clears the content and
  // starts the image grace period, but an earlier existing expiry still wins.
  const result = await db
    .prepare(
      `UPDATE pastes
       SET code = CASE WHEN read_count + 1 >= max_reads THEN '' ELSE code END,
           expires_at = CASE WHEN read_count + 1 >= max_reads THEN MIN(COALESCE(expires_at, ?), ?) ELSE expires_at END,
           read_count = read_count + 1
       WHERE id = ? AND max_reads IS NOT NULL AND read_count < max_reads AND (expires_at IS NULL OR expires_at > ?)`
    )
    .bind(graceEnd, graceEnd, id, now)
    .run();
  return result.meta.changes > 0;
}
