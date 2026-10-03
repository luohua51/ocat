export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const src = url.searchParams.get('src');

  if (!src) {
    return new Response('Missing src', { status: 400 });
  }

  // 只允许代理自己的 Supabase Storage
  const allowed = 'https://qqhvapybydbznvvjmave.supabase.co/storage/';
  if (!src.startsWith(allowed)) {
    return new Response('Forbidden', { status: 403 });
  }

  try {
    const res = await fetch(src);

    if (!res.ok) {
      return new Response('Not found', { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'application/octet-stream';

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err: any) {
    return new Response('Fetch failed: ' + (err?.message || ''), { status: 500 });
  }
}