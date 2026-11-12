import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';

const MAX_BULK_DELETE = 50;

// POST /api/bulk-delete - Delete several pastes and their images (requires auth)
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime as any;

    // Check authentication (session cookie or Bearer token)
    const isAuthed = await isAuthenticated(request, runtime.env.DB, runtime.env.AUTH_KEY);
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json().catch(() => null);
    const ids = body?.ids;
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > MAX_BULK_DELETE ||
      !ids.every((id) => typeof id === 'string' && id !== '')
    ) {
      return new Response(JSON.stringify({ error: `ids must be a list of 1 to ${MAX_BULK_DELETE} paste IDs` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const uniqueIds = [...new Set<string>(ids)];
    const placeholders = uniqueIds.map(() => '?').join(', ');

    // Images go first so none are left pointing at deleted pastes
    const [, result] = await runtime.env.DB.batch([
      runtime.env.DB.prepare(`DELETE FROM paste_images WHERE paste_id IN (${placeholders})`).bind(...uniqueIds),
      runtime.env.DB.prepare(`DELETE FROM pastes WHERE id IN (${placeholders})`).bind(...uniqueIds),
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.meta.changes,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting pastes:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
