/**
 * 把 Supabase Storage URL 转成走 Vercel 代理的 URL
 * 非 Supabase 的 URL 原样返回
 */
export function proxyImage(url: string | null | undefined): string {
  if (!url) return '';
  if (!url.startsWith('https://qqhvapybydbznvvjmave.supabase.co/storage/')) {
    return url;
  }
  return `/api/image-proxy?src=${encodeURIComponent(url)}`;
}