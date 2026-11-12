import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';
import { parseDuration } from '@/lib/config';
import { hashPassword } from '@/lib/password';
import { attachImagesStatements, detachImagesStatement, parseImageIds } from '@/lib/images';
import { NOT_BURNED_SQL } from '@/lib/reads';

// GET /api/:id - Fetch paste details for editing (never returns the password hash or key)
export const GET: APIRoute = async ({ params, request, locals }) => {
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

    const paste = await runtime.env.DB.prepare(
      `SELECT code, language, filename, is_private, password_hash FROM pastes WHERE id = ? AND (expires_at IS NULL OR expires_at > ?) AND ${NOT_BURNED_SQL}`
    )
      .bind(id, Date.now())
      .first();

    if (!paste) {
      return new Response(JSON.stringify({ error: 'Paste not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const imageRows = await runtime.env.DB.prepare(
      'SELECT id FROM paste_images WHERE paste_id = ? ORDER BY created'
    )
      .bind(id)
      .all();

    return new Response(
      JSON.stringify({
        id,
        code: paste.code,
        language: paste.language,
        filename: paste.filename,
        private: paste.is_private === 1,
        hasPassword: !!paste.password_hash,
        images: imageRows.results.map((row: any) => row.id),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching paste:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

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

    if (body.private !== undefined && typeof body.private !== 'boolean') {
      return new Response(JSON.stringify({ error: 'private must be true or false' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Omitting images leaves the paste's images unchanged
    const imageIds = body.images === undefined ? undefined : parseImageIds(body.images);
    if (body.images !== undefined && !imageIds) {
      return new Response(JSON.stringify({ error: 'images must be a list of up to 20 image IDs' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fields left out of the request keep their current values
    const updated = Date.now();
    const sets = ['code = ?', 'language = COALESCE(?, language)', 'filename = COALESCE(?, filename)', 'updated = ?'];
    const values: unknown[] = [code, language || null, filename || null, updated];

    // A password only applies to private pastes, so setting one makes the paste private
    const hasPassword = typeof body.password === 'string' && body.password !== '';
    const isPrivate: boolean | undefined = hasPassword ? true : body.private;
    let passwordHash: string | null | undefined;
    if (hasPassword) {
      passwordHash = await hashPassword(body.password);
    } else if (body.password === null || body.password === '') {
      passwordHash = null;
    }

    if (isPrivate === false) {
      // Public pastes can't keep a key or password
      passwordHash = null;
      sets.push('secret_key = NULL');
    }
    if (isPrivate !== undefined) {
      sets.push('is_private = ?');
      values.push(isPrivate ? 1 : 0);
    }
    if (passwordHash !== undefined) {
      sets.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (body.expires !== undefined) {
      let expiresAt: number | null = null;
      if (body.expires) {
        const ttl = typeof body.expires === 'string' ? parseDuration(body.expires) : null;
        if (ttl === null) {
          return new Response(JSON.stringify({ error: 'Invalid expires value. Use a duration like 10m, 1h, 1d, or 1w.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        expiresAt = updated + ttl;
      }
      sets.push('expires_at = ?');
      values.push(expiresAt);
    }

    const result = await runtime.env.DB.prepare(
      `UPDATE pastes SET ${sets.join(', ')} WHERE id = ? AND (expires_at IS NULL OR expires_at > ?) AND ${NOT_BURNED_SQL}`
    )
      .bind(...values, id, updated)
      .run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: 'Paste not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Attach the listed images and delete any others on this paste
    if (imageIds) {
      await runtime.env.DB.batch([
        ...attachImagesStatements(runtime.env.DB, id, imageIds),
        detachImagesStatement(runtime.env.DB, id, imageIds),
      ]);
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

    // Delete the paste and its images
    const [, result] = await runtime.env.DB.batch([
      runtime.env.DB.prepare('DELETE FROM paste_images WHERE paste_id = ?').bind(id),
      runtime.env.DB.prepare('DELETE FROM pastes WHERE id = ?').bind(id),
    ]);

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
