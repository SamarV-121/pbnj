import type { APIRoute } from 'astro';
import { isAuthenticated } from '@/lib/auth';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, generateImageId } from '@/lib/images';

// POST /api/images - Upload an image. It stays unattached until a paste that references it is saved.
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime as any;

    const isAuthed = await isAuthenticated(request, runtime.env.DB, runtime.env.AUTH_KEY);
    if (!isAuthed) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'File is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return new Response(JSON.stringify({ error: 'Unsupported image type. Use PNG, JPEG, WebP, or GIF.' }), {
        status: 415,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (file.size > MAX_IMAGE_BYTES) {
      return new Response(JSON.stringify({ error: `Image too large. Maximum size is ${MAX_IMAGE_BYTES} bytes.` }), {
        status: 413,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = generateImageId();
    await runtime.env.DB.prepare(
      'INSERT INTO paste_images (id, paste_id, mime, data, created) VALUES (?, NULL, ?, ?, ?)'
    )
      .bind(id, file.type, await file.arrayBuffer(), Date.now())
      .run();

    return new Response(JSON.stringify({ id, url: `/i/${id}` }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
