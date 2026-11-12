import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';
import { hasPasswordAccess } from '@/lib/password';

// Missing and forbidden images return the same response, so IDs can't be probed
function notFound(): Response {
  return new Response('Not found', { status: 404 });
}

// GET /i/:id - Serve an image. Paste images follow the paste's key and password rules.
export const GET: APIRoute = async ({ params, request, locals, url }) => {
  const { id } = params;
  const runtime = locals.runtime as any;

  try {
    const image = await runtime.env.DB.prepare(
      `SELECT i.paste_id, i.mime, i.data, p.id AS paste_exists, p.secret_key, p.password_hash
       FROM paste_images i
       LEFT JOIN pastes p ON p.id = i.paste_id AND (p.expires_at IS NULL OR p.expires_at > ?)
       WHERE i.id = ?`
    ).bind(Date.now(), id).first();

    if (!image) {
      return notFound();
    }

    if (!image.paste_id) {
      // Unattached uploads are only visible to the owner while editing
      if (!(await isAuthenticated(request, runtime.env.DB, runtime.env.AUTH_KEY))) {
        return notFound();
      }
    } else {
      if (!image.paste_exists) {
        return notFound();
      }

      if (image.secret_key && url.searchParams.get('key') !== image.secret_key) {
        return notFound();
      }

      if (image.password_hash && !(await hasPasswordAccess(request, runtime.env.DB, runtime.env.AUTH_KEY, image.paste_id, image.password_hash))) {
        return notFound();
      }
    }

    // D1 may return BLOBs as an array of bytes rather than an ArrayBuffer
    return new Response(new Uint8Array(image.data), {
      headers: {
        'Content-Type': image.mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
