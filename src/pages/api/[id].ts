import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';

// PUT /api/:id - Update paste
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const runtime = locals.runtime as any;

    // Check authentication (session cookie or Bearer token)
    const isAuthed = await isAuthenticated(request, runtime.env.DB, runtime.env.AUTH_KEY);
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { code, language, filename } = body;

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Update the paste and timestamp
    const updated = Date.now();
    const result = await runtime.env.DB.prepare(
      'UPDATE pastes SET code = ?, language = COALESCE(?, language), filename = COALESCE(?, filename), updated = ? WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)'
    )
      .bind(code, language || null, filename || null, updated, id, updated)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Paste not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paste updated successfully',
        id,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating paste:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// DELETE /api/:id - Delete paste
export const DELETE: APIRoute = async ({ params, request, locals }) => {
  try {
    const { id } = params;
    const runtime = locals.runtime as any;

    // Check authentication (session cookie or Bearer token)
    const isAuthed = await isAuthenticated(request, runtime.env.DB, runtime.env.AUTH_KEY);
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Delete the paste
    const result = await runtime.env.DB.prepare(
      'DELETE FROM pastes WHERE id = ?'
    )
      .bind(id)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Paste not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Paste deleted successfully',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error deleting paste:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
