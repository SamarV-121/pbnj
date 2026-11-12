import type { APIRoute } from 'astro';
import { hasPasswordAccess } from '@/lib/password';

export const GET: APIRoute = async ({ params, request, locals, url }) => {
  const { id } = params;
  const runtime = locals.runtime as any;

  try {
    const paste = await runtime.env.DB.prepare(
      'SELECT code, secret_key, password_hash FROM pastes WHERE id = ? AND (expires_at IS NULL OR expires_at > ?)'
    ).bind(id, Date.now()).first();

    if (!paste) {
      return new Response('Not found', { status: 404 });
    }

    // Check if paste requires a key
    if (paste.secret_key) {
      const providedKey = url.searchParams.get('key');
      if (providedKey !== paste.secret_key) {
        return new Response('Not found', { status: 404 });
      }
    }

    // Check if paste requires a password and this request hasn't unlocked it
    if (paste.password_hash && !(await hasPasswordAccess(request, runtime.env.DB, runtime.env.AUTH_KEY, id, paste.password_hash))) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(paste.code, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (error) {
    console.error('Error fetching paste:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
